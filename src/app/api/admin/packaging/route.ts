import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { packagingData } from "@/lib/packaging-input";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  return NextResponse.json(await prisma.packagingOption.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }));
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const data = packagingData(await req.json());
  if (!data) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  return NextResponse.json(await prisma.packagingOption.create({ data }), { status: 201 });
}
