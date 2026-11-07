import type { Metadata } from "next";
import { Jost } from "next/font/google";
import AutoRefresh from "@/components/admin/AutoRefresh";

const jost = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: { default: "Admin — UrPiece", template: "%s | Admin" },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={jost.className}>
      <AutoRefresh intervalMs={30000} />
      {children}
    </div>
  );
}
