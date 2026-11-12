import type { Metadata } from "next";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import PopupManager from "@/components/store/PopupManager";
import AnnouncementBar, { ANNOUNCEMENT_HEIGHT } from "@/components/store/AnnouncementBar";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
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

async function getAnnouncement() {
  const section = await prisma.siteSection.findFirst({
    where: { pageSlug: "site", type: "announcement", isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!section) return null;
  const c = parseJson<Record<string, string>>(section.content, {});
  const messages = (c.messages || "").split("\n").map((m) => m.trim()).filter(Boolean);
  if (messages.length === 0) return null;
  return {
    messages,
    bgColor: c.bgColor,
    textColor: c.textColor,
    speed: parseFloat(c.speed) || 30,
    href: c.barUrl || undefined,
  };
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [tagline, announcement, customer] = await Promise.all([getSiteTagline(), getAnnouncement(), getCustomer()]);
  return (
    <div style={{ "--announce-h": announcement ? `${ANNOUNCEMENT_HEIGHT}px` : "0px" } as React.CSSProperties}>
      {announcement && <AnnouncementBar {...announcement} />}
      <Navbar tagline={tagline} customerName={customer?.name || ""} />
      <main className="min-h-screen" style={{ paddingTop: "var(--announce-h)" }}>{children}</main>
      <Footer />
      <PopupManager />
    </div>
  );
}
