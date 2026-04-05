import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCompany } from "@/lib/company-context";
import { createExpenseJournalEntry } from "@/lib/accounting/journal-engine";
import { z } from "zod";

const UpdateExpenseSchema = z.object({
  supplierName: z.string().optional(),
  invoiceNumber: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  totalSek: z.number().optional(),
  vatAmountSek: z.number().optional(),
  subtotalSek: z.union([z.number(), z.string()]).transform(Number).optional(),
  vatRate: z.number().optional(),
  accountNumber: z.number().int().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["PENDING_REVIEW", "APPROVED", "REJECTED", "BOOKED"]).optional(),
  createJournalEntry: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: { expenseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.expenseId, companyId: company.id },
    include: { supplier: true },
  });

  if (!expense) return NextResponse.json({ error: "Utgift hittades inte" }, { status: 404 });

  return NextResponse.json({ expense });
}

export async function PATCH(
  req: Request,
  { params }: { params: { expenseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  const expense = await prisma.expense.findFirst({
    where: { id: params.expenseId, companyId: company.id },
  });

  if (!expense) return NextResponse.json({ error: "Utgift hittades inte" }, { status: 404 });

  try {
    const body = await req.json() as unknown;
    const data = UpdateExpenseSchema.parse(body);

    const { createJournalEntry, ...updateData } = data;

    const updated = await prisma.expense.update({
      where: { id: params.expenseId },
      data: {
        ...updateData,
        issueDate: updateData.issueDate ? new Date(updateData.issueDate) : undefined,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
        reviewedAt: data.status === "BOOKED" || data.status === "APPROVED" ? new Date() : undefined,
        reviewedByUserId: data.status === "BOOKED" || data.status === "APPROVED" ? session.user.id : undefined,
      },
    });

    // Create journal entry if booking
    if (createJournalEntry && data.status === "BOOKED") {
      try {
        await createExpenseJournalEntry(
          {
            id: updated.id,
            supplierName: updated.supplierName,
            totalSek: updated.totalSek,
            vatAmountSek: updated.vatAmountSek,
            subtotalSek: updated.subtotalSek,
            accountNumber: updated.accountNumber,
          },
          company.id
        );
      } catch (err) {
        console.error("Expense journal entry failed:", err);
      }
    }

    return NextResponse.json({ expense: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Ogiltiga uppgifter", details: error.errors }, { status: 400 });
    }
    console.error("Update expense error:", error);
    return NextResponse.json({ error: "Kunde inte uppdatera utgift" }, { status: 500 });
  }
}
