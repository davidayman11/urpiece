import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const page = req.nextUrl.searchParams.get("page") || "home";
  const sections = await prisma.siteSection.findMany({
    where: { pageSlug: page },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(sections);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { pageSlug, type, content, isVisible, sortOrder } = await req.json();
  const section = await prisma.siteSection.create({
    data: { pageSlug, type, content: JSON.stringify(content || {}), isVisible: isVisible ?? true, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json(section, { status: 201 });
}
