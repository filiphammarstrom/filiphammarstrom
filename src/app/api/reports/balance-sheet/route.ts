import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveCompany } from "@/lib/company-context";
import { getBalanceSheet } from "@/lib/accounting/report-engine";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ? new Date(searchParams.get("date")!) : new Date();

  try {
    const report = await getBalanceSheet(company.id, date);
    return NextResponse.json({ report });
  } catch (error) {
    console.error("Balance sheet error:", error);
    return NextResponse.json({ error: "Kunde inte generera balansräkning" }, { status: 500 });
  }
}
