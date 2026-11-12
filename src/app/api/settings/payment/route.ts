import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseRequired } from "@/lib/checkout-fields";

export async function GET() {
  const settings = await prisma.paymentSettings.findFirst();
  if (!settings) return NextResponse.json({ requiredFields: parseRequired(null) });
  return NextResponse.json({
    instapayId: settings.instapayId,
    instapayPhone: settings.instapayPhone,
    instructions: settings.instructions,
    requiredFields: parseRequired(settings.requiredFields),
    extraFields: (() => { try { return JSON.parse(settings.extraFields || "[]"); } catch { return []; } })(),
  });
}
