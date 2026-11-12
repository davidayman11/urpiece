import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const list = await prisma.governorate.findMany({
    include: { zones: { orderBy: [{ sortOrder: "asc" }, { city: "asc" }] } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(list);
}

/** Add one governorate ({ name }) or many at once ({ names: [...] }). Existing names are skipped. */
export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const names: string[] = (Array.isArray(body.names) ? body.names : [body.name])
    .map((n: unknown) => String(n || "").trim())
    .filter(Boolean);
  if (names.length === 0) return NextResponse.json({ error: "Governorate name is required" }, { status: 400 });

  const existing = new Set((await prisma.governorate.findMany({ select: { name: true } })).map((g) => g.name.toLowerCase()));
  const fresh = [...new Set(names)].filter((n) => !existing.has(n.toLowerCase()));
  if (fresh.length === 0) return NextResponse.json({ error: "That governorate already exists" }, { status: 400 });

  const start = await prisma.governorate.count();
  await prisma.governorate.createMany({ data: fresh.map((name, i) => ({ name, sortOrder: start + i })) });
  return NextResponse.json({ added: fresh.length }, { status: 201 });
}
