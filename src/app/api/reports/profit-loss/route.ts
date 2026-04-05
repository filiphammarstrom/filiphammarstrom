import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveCompany } from "@/lib/company-context";
import { getProfitLoss } from "@/lib/accounting/report-engine";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date(new Date().getFullYear(), 0, 1);
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();

  try {
    const report = await getProfitLoss(company.id, from, to);
    return NextResponse.json({ report });
  } catch (error) {
    console.error("P&L report error:", error);
    return NextResponse.json({ error: "Kunde inte generera rapport" }, { status: 500 });
  }
}
