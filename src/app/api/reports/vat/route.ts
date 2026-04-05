import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveCompany } from "@/lib/company-context";
import { getVatSummary } from "@/lib/accounting/report-engine";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const endOfQuarter = new Date(startOfQuarter.getFullYear(), startOfQuarter.getMonth() + 3, 0);

  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : startOfQuarter;
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : endOfQuarter;

  try {
    const summary = await getVatSummary(company.id, from, to);
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("VAT report error:", error);
    return NextResponse.json({ error: "Kunde inte generera momsrapport" }, { status: 500 });
  }
}
