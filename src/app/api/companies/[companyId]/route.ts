import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateCompanyAccess } from "@/lib/company-context";

export async function GET(
  _req: Request,
  { params }: { params: { companyId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });
  }

  const hasAccess = await validateCompanyAccess(params.companyId, session.user.id);
  if (!hasAccess) {
    return NextResponse.json({ error: "Ingen åtkomst" }, { status: 403 });
  }

  const company = await prisma.company.findUnique({
    where: { id: params.companyId },
  });

  if (!company) {
    return NextResponse.json({ error: "Företag hittades inte" }, { status: 404 });
  }

  return NextResponse.json({ company });
}
