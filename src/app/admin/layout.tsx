import type { Metadata } from "next";
import { Jost } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AutoRefresh from "@/components/admin/AutoRefresh";
import { StockProvider } from "@/components/admin/AdminStockContext";
import { getLowStock } from "@/lib/low-stock";

const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "Admin — UrPiece", template: "%s | Admin" },
};

export const dynamic = "force-dynamic";

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  // Low-stock count for the sidebar badge (only when signed in as admin)
  const session = await getServerSession(authOptions);
  let count = 0;
  if (session) {
    try { count = (await getLowStock()).count; } catch { /* badge is optional */ }
  }
  return (
    <div className={jost.className} dir="ltr" lang="en">
      <AutoRefresh intervalMs={30000} />
      <StockProvider count={count}>{children}</StockProvider>
    </div>
  );
}
