"use client";

import { useState, useEffect } from "react";
import { formatPrice } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ReportData {
  year: number;
  month: number;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  totalExpenses: number;
  netProfit: number;
  orderCount: number;
  topProducts: { name: string; qty: number }[];
  expenses: { category: string; amount: number; date: string }[];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function ReportsClient() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (y: number, m: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?year=${y}&month=${m}`);
      const data = await res.json();
      setReport(data.raw || null);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(year, month); }, [year, month]);

  const exportCSV = () => {
    if (!report) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Revenue", report.totalRevenue],
      ["Cost of Goods Sold", report.totalCOGS],
      ["Gross Profit", report.grossProfit],
      ["Operating Expenses", report.totalExpenses],
      ["Net Profit", report.netProfit],
      ["Orders", report.orderCount],
      [],
      ["Top Products", "Units Sold"],
      ...report.topProducts.map((p) => [p.name, p.qty]),
      [],
      ["Expenses", "Category", "Amount"],
      ...report.expenses.map((e) => [new Date(e.date).toLocaleDateString(), e.category, e.amount]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `urpiece-report-${year}-${String(month).padStart(2, "0")}.csv`;
    a.click();
  };

  const chartData = report ? [
    { name: "Revenue", value: report.totalRevenue, fill: "#A8975E" },
    { name: "COGS", value: report.totalCOGS, fill: "#EDE6D4" },
    { name: "Gross Profit", value: report.grossProfit, fill: "#10b981" },
    { name: "Expenses", value: report.totalExpenses, fill: "#f59e0b" },
    { name: "Net Profit", value: report.netProfit, fill: "#6366f1" },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Financial Reports</h1>
        <div className="flex gap-3 items-center">
          <select value={year} onChange={(e) => setYear(+e.target.value)} className="border border-gray-200 rounded px-3 py-2 text-sm">
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={month} onChange={(e) => setMonth(+e.target.value)} className="border border-gray-200 rounded px-3 py-2 text-sm">
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <button onClick={exportCSV} disabled={!report} className="px-4 py-2 text-sm border border-[#A8975E] text-[#A8975E] rounded hover:bg-[#A8975E] hover:text-white transition-colors disabled:opacity-50">
            Export CSV
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-16 text-gray-400">Loading report...</div>}

      {!loading && report && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Revenue", value: formatPrice(report.totalRevenue), color: "text-[#A8975E]" },
              { label: "COGS", value: formatPrice(report.totalCOGS), color: "text-orange-600" },
              { label: "Gross Profit", value: formatPrice(report.grossProfit), color: "text-emerald-600" },
              { label: "Expenses", value: formatPrice(report.totalExpenses), color: "text-amber-600" },
              { label: "Net Profit", value: formatPrice(report.netProfit), color: report.netProfit >= 0 ? "text-indigo-600" : "text-red-600" },
            ].map((k) => (
              <div key={k.label} className="bg-white rounded-lg p-4 border border-gray-50">
                <p className="text-xs text-gray-500">{k.label}</p>
                <p className={`text-xl font-semibold mt-1 ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white rounded-lg p-5 border border-gray-50">
            <h2 className="font-medium text-gray-700 mb-4">Summary — {MONTHS[report.month - 1]} {report.year}</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatPrice(Number(v))} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Products */}
            <div className="bg-white rounded-lg p-5 border border-gray-50">
              <h2 className="font-medium text-gray-700 mb-4">Top Products</h2>
              {report.topProducts.length === 0 ? (
                <p className="text-sm text-gray-400">No sales this month</p>
              ) : (
                <div className="space-y-2">
                  {report.topProducts.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 text-sm">
                      <span className="text-gray-400 w-4">{i + 1}</span>
                      <span className="flex-1 text-gray-700 truncate">{p.name}</span>
                      <span className="text-gray-500">{p.qty} sold</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expenses breakdown */}
            <div className="bg-white rounded-lg p-5 border border-gray-50">
              <h2 className="font-medium text-gray-700 mb-4">Expenses</h2>
              {report.expenses.length === 0 ? (
                <p className="text-sm text-gray-400">No expenses recorded</p>
              ) : (
                <div className="space-y-2">
                  {report.expenses.map((e, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-gray-700">{e.category}</span>
                        <span className="text-gray-400 ml-2 text-xs">{new Date(e.date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-amber-600">{formatPrice(e.amount)}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-gray-100 flex justify-between font-medium text-sm">
                    <span>Total</span>
                    <span className="text-amber-600">{formatPrice(report.totalExpenses)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && !report && (
        <div className="text-center py-16 text-gray-400">No data for this period</div>
      )}
    </div>
  );
}
