import type { Metadata } from "next";
import Navbar from "@/components/store/Navbar";
import Footer from "@/components/store/Footer";
import PopupManager from "@/components/store/PopupManager";
import AnnouncementBar, { ANNOUNCEMENT_HEIGHT } from "@/components/store/AnnouncementBar";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import { getTexts, getT } from "@/lib/texts/server";
import { TextsProvider } from "@/components/store/TextsProvider";
import { getFontSettings } from "@/lib/font-settings";
import { buildFontCss, buildFontsUrl, fontsInUse } from "@/lib/fonts";
import { parseJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const title = t("site.title");
  return { title: { default: title, template: `%s | ${title}` }, description: t("site.description") };
}

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
  const [tagline, announcement, customer, bundleCount, texts, fonts] = await Promise.all([
    getSiteTagline(), getAnnouncement(), getCustomer(), prisma.bundle.count({ where: { isActive: true } }), getTexts(), getFontSettings(),
  ]);
  // Fonts chosen in Admin > Fonts / Site Text: CSS for the sections + one Google Fonts link for the extra fonts
  const fontCss = buildFontCss(fonts.config);
  const fontsUrl = buildFontsUrl(fontsInUse(fonts.config, fonts.styles));
  return (
    <TextsProvider texts={texts} styles={fonts.styles}>
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} precedence="default" />}
      {fontCss && <style dangerouslySetInnerHTML={{ __html: fontCss }} />}
    <div style={{ "--announce-h": announcement ? `${ANNOUNCEMENT_HEIGHT}px` : "0px" } as React.CSSProperties}>
      {announcement && <AnnouncementBar {...announcement} />}
      <Navbar tagline={tagline} customerName={customer?.name || ""} hasBundles={bundleCount > 0} />
      <main className="min-h-screen" style={{ paddingTop: "var(--announce-h)" }}>{children}</main>
      <Footer />
      <PopupManager />
    </div>
    </TextsProvider>
  );
}
