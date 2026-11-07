import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const yearParam = req.nextUrl.searchParams.get("year");
  const monthParam = req.nextUrl.searchParams.get("month");

  if (!yearParam || !monthParam) {
    // Return all monthly reports
    const reports = await prisma.monthlyReport.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }] });
    return NextResponse.json(reports);
  }

  const year = parseInt(yearParam);
  const month = parseInt(monthParam);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);

  // Generate/refresh report for this month
  const completedStatuses = ["CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"];

  const [revenueResult, orderItems, expenses, orderCount, topProducts] = await Promise.all([
    prisma.order.aggregate({
      where: { status: { in: completedStatuses }, createdAt: { gte: start, lte: end } },
      _sum: { total: true, discount: true },
    }),
    prisma.orderItem.findMany({
      where: { order: { status: { in: completedStatuses }, createdAt: { gte: start, lte: end } } },
    }),
    prisma.expense.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.order.count({ where: { status: { in: completedStatuses }, createdAt: { gte: start, lte: end } } }),
    prisma.orderItem.groupBy({
      by: ["productName"],
      where: { order: { status: { in: completedStatuses }, createdAt: { gte: start, lte: end } } },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
  ]);

  const totalRevenue = revenueResult._sum.total || 0;
  const totalCOGS = orderItems.reduce((sum, i) => sum + i.costPrice * i.quantity, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const topProductsMapped = topProducts.map((p) => ({ name: p.productName, qty: p._sum.quantity }));
  const expensesMapped = expenses.map((e) => ({ category: e.category, amount: e.amount, date: e.date }));

  const reportData = {
    year, month, totalRevenue, totalCOGS, grossProfit, totalExpenses, netProfit, orderCount,
    topProducts: topProductsMapped,
    expenses: expensesMapped,
  };

  const modelFields = { year, month, totalRevenue, totalCOGS, grossProfit, totalExpenses, netProfit, orderCount };

  // Save/update report
  await prisma.monthlyReport.upsert({
    where: { year_month: { year, month } },
    create: { ...modelFields, data: JSON.stringify(reportData) },
    update: { ...modelFields, data: JSON.stringify(reportData), generatedAt: new Date() },
  });

  return NextResponse.json({ raw: reportData });
}
