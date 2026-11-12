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
import { buildFontCss, buildFontsUrl, fontsInUse, ARABIC_DEFAULT_FONTS } from "@/lib/fonts";
import { getLang } from "@/lib/lang-server";
import type { Lang } from "@/lib/lang";
import { cx } from "@/lib/localize";
import { parseJson } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  const title = t("site.title");
  return { title: { default: title, template: `%s | ${title}` }, description: t("site.description") };
}

async function getSiteTagline(lang: Lang) {
  const section = await prisma.siteSection.findFirst({
    where: { pageSlug: "site", type: "settings", isVisible: true },
  });
  if (!section) return "";
  const c = parseJson<Record<string, string>>(section.content, {});
  return cx(c, "tagline", lang);
}

async function getAnnouncement(lang: Lang) {
  const section = await prisma.siteSection.findFirst({
    where: { pageSlug: "site", type: "announcement", isVisible: true },
    orderBy: { sortOrder: "asc" },
  });
  if (!section) return null;
  const c = parseJson<Record<string, string>>(section.content, {});
  const messages = cx(c, "messages", lang).split("\n").map((m) => m.trim()).filter(Boolean);
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
  const lang = await getLang();
  const [tagline, announcement, customer, bundleCount, texts, fonts] = await Promise.all([
    getSiteTagline(lang), getAnnouncement(lang), getCustomer(), prisma.bundle.count({ where: { isActive: true } }), getTexts(lang), getFontSettings(),
  ]);
  // Fonts chosen in Admin > Fonts / Site Text: CSS for the sections + one Google Fonts link for the extra fonts
  const fontCss = buildFontCss(fonts.config);
  // The Arabic version also needs its Arabic fonts (the admin can change them in Fonts > "Arabic version")
  const arabic = fonts.config.areas.arabic;
  const wanted = fontsInUse(fonts.config, fonts.styles);
  if (lang === "ar") for (const n of [arabic?.heading || ARABIC_DEFAULT_FONTS.heading, arabic?.body || ARABIC_DEFAULT_FONTS.body]) if (!wanted.includes(n)) wanted.push(n);
  const fontsUrl = buildFontsUrl(wanted);
  return (
    <TextsProvider texts={texts} styles={fonts.styles} lang={lang}>
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
