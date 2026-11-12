"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useLowStockCount } from "@/components/admin/AdminStockContext";

const NAV = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "⬛" },
  { label: "Products", href: "/admin/products", icon: "🏷" },
  { label: "Categories", href: "/admin/categories", icon: "📂" },
  { label: "Orders", href: "/admin/orders", icon: "📦" },
  { label: "Customers", href: "/admin/customers", icon: "👥" },
  { label: "Pages & Sections", href: "/admin/pages", icon: "🖼" },
  { label: "Popups", href: "/admin/popups", icon: "💬" },
  { label: "Shipping", href: "/admin/shipping", icon: "🚚" },
  { label: "Discounts", href: "/admin/discounts", icon: "💰" },
  { label: "Promo Codes", href: "/admin/promo-codes", icon: "🎟" },
  { label: "Expenses", href: "/admin/expenses", icon: "💸" },
  { label: "Reports", href: "/admin/reports", icon: "📊" },
  { label: "Settings", href: "/admin/settings", icon: "⚙" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const lowStock = useLowStockCount();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#F7F5F0] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white border-r border-gray-100 flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:flex`}
      >
        {/* Logo */}
        <div className="p-5 border-b border-gray-100">
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <span className="font-serif text-lg text-[#A8975E] tracking-widest uppercase">UrPiece</span>
          </Link>
          <p className="text-[10px] text-gray-400 tracking-wider mt-0.5">Admin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map(({ label, href, icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`admin-sidebar-link ${active ? "active" : ""}`}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
                {href === "/admin/products" && lowStock > 0 && (
                  <span
                    title={`${lowStock} low-stock item${lowStock === 1 ? "" : "s"}`}
                    className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center"
                  >
                    {lowStock}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100">
          <Link
            href="/"
            target="_blank"
            className="admin-sidebar-link text-xs"
          >
            <span>🔗</span> View Store
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/admin/login" })}
            className="admin-sidebar-link w-full text-left text-red-500 hover:text-red-600 hover:bg-red-50 mt-1"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center px-6 gap-4 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500"
          >
            <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
              <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <div className="flex-1" />
          <span className="text-sm text-gray-500">Admin</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
