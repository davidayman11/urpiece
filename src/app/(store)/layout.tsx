import type { Metadata } from "next";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import PopupManager from "@/components/store/PopupManager";
import { prisma } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "UrPiece", template: "%s | UrPiece" },
  description: "Premium jewelry and accessories.",
};

async function getSiteTagline() {
  const section = await prisma.siteSection.findFirst({
    where: { pageSlug: "site", type: "settings", isVisible: true },
  });
  if (!section) return "";
  const c = parseJson<Record<string, string>>(section.content, {});
  return c.tagline || "";
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const tagline = await getSiteTagline();
  return (
    <>
      <Navbar tagline={tagline} />
      <main className="min-h-screen">{children}</main>
      <Footer />
      <PopupManager />
    </>
  );
}
