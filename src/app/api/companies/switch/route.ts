import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { ACTIVE_COMPANY_COOKIE, validateCompanyAccess } from "@/lib/company-context";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const { companyId } = await req.json() as { companyId: string };

  if (!companyId) {
    return NextResponse.json({ error: "companyId krävs" }, { status: 400 });
  }

  const hasAccess = await validateCompanyAccess(companyId, session.user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Ingen åtkomst till detta företag" }, { status: 403 });
  }

  const cookieStore = cookies();
  cookieStore.set(ACTIVE_COMPANY_COOKIE, companyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  return NextResponse.json({ success: true });
}
