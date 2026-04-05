import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveCompany } from "@/lib/company-context";
import { prisma } from "@/lib/prisma";
import { tinkClient } from "@/lib/bank/tink-client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  const { connectionId } = await req.json() as { connectionId: string };

  const connection = await prisma.bankConnection.findFirst({
    where: { id: connectionId, companyId: company.id },
  });

  if (!connection) {
    return NextResponse.json({ error: "Bankkonnektion hittades inte" }, { status: 404 });
  }

  if (!connection.accessToken) {
    return NextResponse.json({ error: "Bankkonnektion saknar åtkomsttoken" }, { status: 400 });
  }

  try {
    const transactions = await tinkClient.getTransactions(
      connection.accessToken,
      connection.accountId
    );

    let imported = 0;
    for (const tx of transactions) {
      const amount =
        (parseInt(tx.amount.value.unscaledValue) / Math.pow(10, parseInt(tx.amount.value.scale)));

      try {
        await prisma.bankTransaction.upsert({
          where: {
            bankConnectionId_externalId: {
              bankConnectionId: connection.id,
              externalId: tx.id,
            },
          },
          update: {},
          create: {
            bankConnectionId: connection.id,
            externalId: tx.id,
            transactionDate: new Date(tx.dates.value ?? tx.dates.booked ?? new Date()),
            bookingDate: tx.dates.booked ? new Date(tx.dates.booked) : null,
            description: tx.descriptions.display ?? tx.descriptions.original,
            amount,
            currency: tx.amount.currencyCode,
            merchantName: tx.merchantInformation?.merchantName ?? null,
            category: tx.merchantInformation?.merchantCategoryCode ?? null,
          },
        });
        imported++;
      } catch {
        // Ignore duplicate errors
      }
    }

    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: { lastSyncedAt: new Date() },
    });

    return NextResponse.json({ imported, total: transactions.length });
  } catch (error) {
    console.error("Transaction sync error:", error);
    return NextResponse.json({ error: "Kunde inte synkronisera transaktioner" }, { status: 500 });
  }
}
