import type { ReactNode } from "react";
import { getLang } from "@/lib/lang-server";
import { buildFontsUrl, fontStack, isCatalogFont } from "@/lib/fonts";

/**
 * Gives one section its own font (chosen in Admin > Pages > the section > Font).
 * Headings and normal text inside use it, and the font file is loaded when needed.
 * Only the English version uses it: the Arabic version keeps its Arabic fonts (Fonts > Arabic version).
 */
export default async function FontScope({ content, children }: { content?: Record<string, string>; children: ReactNode }) {
  const name = content?.font;
  if (!name || !isCatalogFont(name) || (await getLang()) !== "en") return <>{children}</>;
  const stack = fontStack(name);
  const url = buildFontsUrl([name]);
  return (
    <div style={{ ["--site-font-heading" as string]: stack, ["--site-font-body" as string]: stack, fontFamily: stack }}>
      {url && <link rel="stylesheet" href={url} precedence="default" />}
      {children}
    </div>
  );
}
