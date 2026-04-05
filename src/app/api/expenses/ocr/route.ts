import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveCompany } from "@/lib/company-context";
import { extractReceiptData } from "@/lib/ocr/google-vision";
import { put } from "@vercel/blob";
import type { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Ej inloggad" }, { status: 401 });

  const company = await getActiveCompany(session.user.id);
  if (!company) return NextResponse.json({ error: "Inget aktivt företag" }, { status: 400 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Ingen fil bifogad" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Filtypen stöds ej. Använd JPG, PNG eller PDF." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Filen är för stor (max 10 MB)" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to blob storage
    let rawImageUrl: string | null = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const filename = `expenses/${company.id}/${Date.now()}-${file.name}`;
        const blob = await put(filename, buffer, {
          access: "public",
          contentType: file.type,
        });
        rawImageUrl = blob.url;
      } catch (blobError) {
        console.warn("Blob upload failed, continuing without image URL:", blobError);
      }
    }

    // Run OCR
    let ocrData = null;
    if (file.type.startsWith("image/")) {
      try {
        ocrData = await extractReceiptData(buffer, file.type);
      } catch (ocrError) {
        console.warn("OCR failed, creating expense without OCR data:", ocrError);
      }
    }

    // Create expense record
    const expense = await prisma.expense.create({
      data: {
        companyId: company.id,
        status: "PENDING_REVIEW",
        source: "PHOTO_OCR",
        rawImageUrl,
        ocrData: ocrData ? (ocrData as unknown as Prisma.JsonObject) : undefined,
        supplierName: ocrData?.supplierName ?? null,
        invoiceNumber: ocrData?.invoiceNumber ?? null,
        issueDate: ocrData?.issueDate ? new Date(ocrData.issueDate) : null,
        dueDate: ocrData?.dueDate ? new Date(ocrData.dueDate) : null,
        totalSek: ocrData?.totalAmount ?? null,
        vatAmountSek: ocrData?.vatAmount ?? null,
        subtotalSek:
          ocrData?.totalAmount && ocrData?.vatAmount
            ? ocrData.totalAmount - ocrData.vatAmount
            : null,
        currency: ocrData?.currency ?? "SEK",
      },
    });

    return NextResponse.json({
      expense,
      message: ocrData
        ? "Kvitto uppladdat och analyserat"
        : "Kvitto uppladdat (OCR ej tillgänglig)",
    });
  } catch (error) {
    console.error("OCR upload error:", error);
    return NextResponse.json({ error: "Uppladdning misslyckades" }, { status: 500 });
  }
}
