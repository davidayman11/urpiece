import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

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
  const popup = await prisma.popup.create({ data: { ...data, pages: JSON.stringify(data.pages || ["*"]) } });
  return NextResponse.json(popup, { status: 201 });
}
