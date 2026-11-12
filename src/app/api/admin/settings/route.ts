import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { parseFieldModes, parseCustomFields, resolveFieldOrder } from "@/lib/checkout-fields";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const settings = await prisma.paymentSettings.findFirst();
  return NextResponse.json(settings || {});
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { instapayId, instapayPhone, instructions, instructionsAr, extraFields, requiredFields, customFields, fieldOrder } = await req.json();
  const required = JSON.stringify(parseFieldModes(JSON.stringify(requiredFields || {})));
  const customParsed = parseCustomFields(JSON.stringify(customFields || []));
  const custom = JSON.stringify(customParsed);
  const order = JSON.stringify(resolveFieldOrder(Array.isArray(fieldOrder) ? fieldOrder : [], customParsed.map((f) => f.id)));
  const extra = JSON.stringify(
    (Array.isArray(extraFields) ? extraFields : [])
      .filter((f: { value?: string; label?: string }) => f && (f.value || f.label))
      .map((f: { id?: string; label?: string; labelAr?: string; value?: string; type?: string }) => ({
        id: String(f.id || Math.random().toString(36).slice(2)),
        label: String(f.label || ""),
        labelAr: String(f.labelAr || "").trim(),
        value: String(f.value || ""),
        type: ["text", "link", "qr"].includes(f.type || "") ? f.type : "text",
      }))
  );
  const existing = await prisma.paymentSettings.findFirst();
  if (existing) {
    const s = await prisma.paymentSettings.update({
      where: { id: existing.id },
      data: { instapayId, instapayPhone, instructions, instructionsAr: String(instructionsAr || "").trim() || null, extraFields: extra, requiredFields: required, customFields: custom, fieldOrder: order },
    });
    return NextResponse.json(s);
  }
  const s = await prisma.paymentSettings.create({ data: { instapayId, instapayPhone, instructions, instructionsAr: String(instructionsAr || "").trim() || null, extraFields: extra, requiredFields: required, customFields: custom, fieldOrder: order } });
  return NextResponse.json(s);
}
