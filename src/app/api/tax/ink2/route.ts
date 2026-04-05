import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveCompany } from "@/lib/company-context";
import { getProfitLoss, getBalanceSheet } from "@/lib/accounting/report-engine";
import { calculateINK2Summary, generateINK2XmlStub } from "@/lib/tax/ink2-stub";
import { format, startOfYear, endOfYear } from "date-fns";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()));

  const from = startOfYear(new Date(year, 0, 1));
  const to = endOfYear(new Date(year, 0, 1));

  try {
    const [profitLoss, balanceSheet] = await Promise.all([
      getProfitLoss(company.id, from, to),
      getBalanceSheet(company.id, to),
    ]);

    const data = {
      companyName: company.name,
      orgNumber: company.orgNumber,
      fiscalYearStart: format(from, "yyyy-MM-dd"),
      fiscalYearEnd: format(to, "yyyy-MM-dd"),
      profitLoss,
      balanceSheet,
    };

    const summary = calculateINK2Summary(data);
    const xml = generateINK2XmlStub(data, summary);

    return new NextResponse(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Content-Disposition": `attachment; filename="ink2-${year}-stub.xml"`,
      },
    });
  } catch (error) {
    console.error("INK2 error:", error);
    return NextResponse.json({ error: "Kunde inte generera INK2" }, { status: 500 });
  }
}
