import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLang } from "@/lib/lang-server";
import { L } from "@/lib/localize";

export async function GET() {
  const now = new Date();
  const popup = await prisma.popup.findFirst({
    where: {
      isActive: true,
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });

  if (!popup) return NextResponse.json(null);
  const lang = await getLang();
  return NextResponse.json({
    ...popup,
    heading: L(lang, popup.heading, popup.headingAr),
    body: L(lang, popup.body, popup.bodyAr),
    buttonText: L(lang, popup.buttonText, popup.buttonTextAr),
  });
}
