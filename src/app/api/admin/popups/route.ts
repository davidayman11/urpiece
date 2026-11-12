import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

const arabic = (d: Record<string, unknown>) => ({
  headingAr: String(d.headingAr || "").trim() || null,
  bodyAr: String(d.bodyAr || "").trim() || null,
  buttonTextAr: String(d.buttonTextAr || "").trim() || null,
  promoCode: String(d.promoCode || "").trim().toUpperCase() || null,
});

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const popups = await prisma.popup.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(popups);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const data = await req.json();
  const popup = await prisma.popup.create({ data: { ...data, ...arabic(data), pages: JSON.stringify(data.pages || ["*"]) } });
  return NextResponse.json(popup, { status: 201 });
}
