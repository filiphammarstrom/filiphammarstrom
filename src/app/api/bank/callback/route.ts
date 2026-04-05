import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveCompany } from "@/lib/company-context";
import { prisma } from "@/lib/prisma";
import { tinkClient } from "@/lib/bank/tink-client";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.redirect("/login");

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.redirect("/companies/new");

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`/bank?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.redirect("/bank?error=no_code");
  }

  if (!tinkClient.isEnabled()) {
    return NextResponse.redirect("/bank?error=tink_disabled");
  }

  try {
    const tokens = await tinkClient.exchangeCodeForToken(code);
    const accounts = await tinkClient.getAccounts(tokens.access_token);

    for (const account of accounts) {
      const iban = account.identifiers?.iban?.iban;
      const balance = account.balance?.booked?.amount?.value;

      await prisma.bankConnection.upsert({
        where: {
          // Use a composite identifier
          id: `${company.id}-${account.id}`,
        },
        update: {
          accountName: account.name,
          iban: iban ?? null,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? null,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          lastSyncedAt: new Date(),
        },
        create: {
          id: `${company.id}-${account.id}`,
          companyId: company.id,
          provider: "tink",
          accountId: account.id,
          accountName: account.name,
          iban: iban ?? null,
          currency: account.balance?.booked?.amount?.currencyCode ?? "SEK",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? null,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          lastSyncedAt: new Date(),
        },
      });
    }

    return NextResponse.redirect("/bank?connected=1");
  } catch (err) {
    console.error("Bank callback error:", err);
    return NextResponse.redirect("/bank?error=connection_failed");
  }
}
