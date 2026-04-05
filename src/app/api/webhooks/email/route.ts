import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseExpenseEmail, parsedExpenseToOcrData } from "@/lib/email/parse-expense";
import type { Prisma } from "@prisma/client";

/**
 * Webhook endpoint for receiving email invoices/receipts.
 * Configure this URL in your email webhook provider (e.g., Postmark, SendGrid Inbound, Mailgun).
 *
 * The company is identified by the email address the message was sent to.
 * Convention: receipts+{companyId}@yourdomain.com
 */
export async function POST(req: Request) {
  try {
    // Verify webhook secret (optional but recommended)
    const webhookSecret = req.headers.get("x-webhook-secret");
    if (process.env.WEBHOOK_SECRET && webhookSecret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Obehörig" }, { status: 401 });
    }

    const raw = await req.json();

    // Normalize payload — support both Postmark and generic formats
    // Postmark uses: From, To, Subject, TextBody, HtmlBody, Attachments[].Name/.Content/.ContentType
    // Generic uses:  from, to, subject, text, html, attachments[].filename/.content/.contentType
    const payload = {
      from:    raw.From    ?? raw.from    ?? "",
      to:      raw.To      ?? raw.to      ?? "",
      subject: raw.Subject ?? raw.subject ?? "",
      html:    raw.HtmlBody ?? raw.html,
      text:    raw.TextBody ?? raw.text,
      attachments: (raw.Attachments ?? raw.attachments ?? []).map((a: Record<string, string>) => ({
        filename:    a.Name        ?? a.filename    ?? "",
        content:     a.Content     ?? a.content     ?? "",
        contentType: a.ContentType ?? a.contentType ?? "",
      })),
    };

    if (!payload.from || !payload.to) {
      return NextResponse.json({ error: "from och to krävs" }, { status: 400 });
    }

    // Extract company ID from email address
    // e.g., receipts+clxxx123@accounting.yourdomain.com
    const toMatch = payload.to.match(/\+([a-zA-Z0-9]+)@/);
    const companyId = toMatch?.[1];

    if (!companyId) {
      return NextResponse.json({
        error: "Kan inte identifiera företag från e-postadress",
      }, { status: 400 });
    }

    // Verify company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    });

    if (!company) {
      return NextResponse.json({ error: "Företag hittades inte" }, { status: 404 });
    }

    // Parse the email
    const parsed = parseExpenseEmail(payload);
    const ocrData = parsedExpenseToOcrData(parsed);

    // Create expense record
    const expense = await prisma.expense.create({
      data: {
        companyId: company.id,
        status: "PENDING_REVIEW",
        source: "EMAIL_PARSED",
        rawEmailId: payload.subject,
        ocrData: ocrData as unknown as Prisma.JsonObject,
        supplierName: parsed.supplierName ?? null,
        invoiceNumber: parsed.invoiceNumber ?? null,
        issueDate: parsed.issueDate ? new Date(parsed.issueDate) : null,
        dueDate: parsed.dueDate ? new Date(parsed.dueDate) : null,
        totalSek: parsed.totalAmount ?? null,
        vatAmountSek: parsed.vatAmount ?? null,
        subtotalSek:
          parsed.totalAmount && parsed.vatAmount
            ? parsed.totalAmount - parsed.vatAmount
            : null,
        currency: "SEK",
        description: payload.subject,
      },
    });

    console.log(`E-post utgift skapad: ${expense.id} för företag ${company.name}`);

    return NextResponse.json({
      success: true,
      expenseId: expense.id,
      message: "E-post bearbetad och utgift skapad",
    });
  } catch (error) {
    console.error("Email webhook error:", error);
    return NextResponse.json({ error: "Webhook-bearbetning misslyckades" }, { status: 500 });
  }
}
