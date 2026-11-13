import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const presets = await prisma.variantPreset.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(
    presets.map((p) => ({
      id: p.id,
      name: p.name,
      values: (() => { try { return JSON.parse(p.values); } catch { return []; } })(),
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, values } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!Array.isArray(values) || values.length === 0)
    return NextResponse.json({ error: "At least one value is required" }, { status: 400 });

  const preset = await prisma.variantPreset.create({
    data: { name: name.trim(), values: JSON.stringify(values.map((v: string) => String(v).trim()).filter(Boolean)) },
  });
  return NextResponse.json({ id: preset.id, name: preset.name, values: JSON.parse(preset.values) }, { status: 201 });
}
