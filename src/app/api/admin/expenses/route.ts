import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const year = req.nextUrl.searchParams.get("year");
  const month = req.nextUrl.searchParams.get("month");

  const where: Record<string, unknown> = {};
  if (year && month) {
    const start = new Date(parseInt(year), parseInt(month) - 1, 1);
    const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    where.date = { gte: start, lte: end };
  }

  const expenses = await prisma.expense.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json(expenses);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const { category, description, amount, date } = await req.json();
  if (!category || !amount || !date) return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  const expense = await prisma.expense.create({
    data: { category, description, amount: parseFloat(amount), date: new Date(date) },
  });
  return NextResponse.json(expense, { status: 201 });
}
