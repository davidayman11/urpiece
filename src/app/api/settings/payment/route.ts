import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.paymentSettings.findFirst();
  if (!settings) return NextResponse.json({});
  return NextResponse.json({
    instapayId: settings.instapayId,
    instapayPhone: settings.instapayPhone,
    instructions: settings.instructions,
  });
}
