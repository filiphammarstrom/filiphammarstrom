import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveCompany } from "@/lib/company-context";
import { tinkClient } from "@/lib/bank/tink-client";
import { randomBytes } from "crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  if (!tinkClient.isEnabled()) {
    return NextResponse.json({
      error: "Tink-integration är inte aktiverad",
      message: "Sätt TINK_ENABLED=true och konfigurera TINK_CLIENT_ID/SECRET för att aktivera bankintegration.",
    }, { status: 503 });
  }

  const state = randomBytes(16).toString("hex");
  const authUrl = tinkClient.getAuthorizationUrl(state);

  return NextResponse.json({ authUrl, state });
}
