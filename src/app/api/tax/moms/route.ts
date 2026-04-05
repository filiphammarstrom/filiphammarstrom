import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveCompany } from "@/lib/company-context";
import { getVatSummary } from "@/lib/accounting/report-engine";
import { generateMomsXml } from "@/lib/tax/moms-xml";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  const fullCompany = await prisma.company.findUnique({
    where: { id: company.id },
    select: { orgNumber: true, name: true, vatNumber: true },
  });
  if (!fullCompany) return NextResponse.json({ error: "Företag hittades inte" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const now = new Date();
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : now;

  const vatSummary = await getVatSummary(company.id, from, to);

  if (format === "xml") {
    const xml = generateMomsXml({
      company: fullCompany,
      vatSummary,
      periodYear: from.getFullYear(),
      periodMonth: from.getMonth() + 1,
    });

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="momsdeklaration-${from.getFullYear()}${String(from.getMonth() + 1).padStart(2, "0")}.xml"`,
      },
    });
  }

  return NextResponse.json({ vatSummary });
}
