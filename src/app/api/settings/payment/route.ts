import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseFieldModes, parseCustomFields } from "@/lib/checkout-fields";

export async function GET() {
  const settings = await prisma.paymentSettings.findFirst();
  if (!settings) return NextResponse.json({ fieldModes: parseFieldModes(null), customFields: [] });
  return NextResponse.json({
    instapayId: settings.instapayId,
    instapayPhone: settings.instapayPhone,
    instructions: settings.instructions,
    fieldModes: parseFieldModes(settings.requiredFields),
    customFields: parseCustomFields(settings.customFields),
    extraFields: (() => { try { return JSON.parse(settings.extraFields || "[]"); } catch { return []; } })(),
  });
}
