import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { ACTIVE_COMPANY_COOKIE, getUserCompanies, getActiveCompany } from "@/lib/company-context";
import { z } from "zod";
import { BAS_ACCOUNTS } from "@/lib/accounting/bas-accounts";

const CreateCompanySchema = z.object({
  name: z.string().min(1),
  orgNumber: z.string().min(1),
  vatNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  bankgiro: z.string().optional(),
  plusgiro: z.string().optional(),
  vatPeriod: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).default("QUARTERLY"),
  fTaxCertificate: z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true").default(false),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const companies = await getUserCompanies(session.user.id);
  const activeCompany = await getActiveCompany(session.user.id);

  return NextResponse.json({ companies, activeCompany });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  try {
    const body = await req.json() as unknown;
    const data = CreateCompanySchema.parse(body);

    // Check org number uniqueness
    const existing = await prisma.company.findUnique({
      where: { orgNumber: data.orgNumber },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Organisationsnummer redan registrerat" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: data.name,
        orgNumber: data.orgNumber,
        vatNumber: data.vatNumber || null,
        address: data.address || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        email: data.email || null,
        phone: data.phone || null,
        bankgiro: data.bankgiro || null,
        plusgiro: data.plusgiro || null,
        vatPeriod: data.vatPeriod,
        fTaxCertificate: data.fTaxCertificate,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    // Create BAS accounts
    for (const account of BAS_ACCOUNTS) {
      await prisma.chartOfAccount.create({
        data: {
          companyId: company.id,
          accountNumber: account.accountNumber,
          name: account.name,
          type: account.type,
          vatCode: account.vatCode,
          isSystem: true,
        },
      });
    }

    // Create fiscal year
    const currentYear = new Date().getFullYear();
    await prisma.fiscalYear.create({
      data: {
        id: `fy-${company.id}-${currentYear}`,
        companyId: company.id,
        startDate: new Date(`${currentYear}-01-01`),
        endDate: new Date(`${currentYear}-12-31`),
      },
    });

    // Set as active company
    const cookieStore = cookies();
    cookieStore.set(ACTIVE_COMPANY_COOKIE, company.id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Ogiltiga uppgifter", details: error.errors }, { status: 400 });
    }
    console.error("Create company error:", error);
    return NextResponse.json({ error: "Kunde inte skapa företag" }, { status: 500 });
  }
}
