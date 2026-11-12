import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import TextsClient from "@/components/admin/TextsClient";
import Link from "next/link";
import { TEXT_DEFS, AR_DEFAULTS } from "@/lib/texts";
import { AR_PREFIX } from "@/lib/texts/server";
import { getFontSettings } from "@/lib/font-settings";
import { FONT_CATALOG, buildFontsUrl } from "@/lib/fonts";
import { NON_STYLEABLE_KEYS } from "@/lib/texts/non-styleable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Text" };

export default async function TextsAdminPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang: langParam } = await searchParams;
  const lang: "en" | "ar" = langParam === "ar" ? "ar" : "en";
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const rows = await prisma.siteText.findMany();
  // this language's edits only (Arabic ones are stored as "ar:<key>")
  const overrides = Object.fromEntries(
    rows
      .filter((r) => r.key.startsWith(AR_PREFIX) === (lang === "ar"))
      .map((r) => [lang === "ar" ? r.key.slice(AR_PREFIX.length) : r.key, r.value])
  );
  // Arabic: the built-in Arabic wording is the "default" shown here
  const defs = lang === "ar" ? TEXT_DEFS.map((d) => ({ ...d, default: AR_DEFAULTS[d.key] ?? d.default })) : TEXT_DEFS;
  const { styles } = await getFontSettings();
  const previewUrl = buildFontsUrl(FONT_CATALOG.filter((f) => !f.preloaded).map((f) => f.name));
  return (
    <AdminLayout>
      {previewUrl && <link rel="stylesheet" href={previewUrl} precedence="default" />}
      <div className="max-w-3xl mb-4 flex items-center gap-2">
        {([["en", "English"], ["ar", "العربية (Arabic)"]] as const).map(([l, label]) => (
          <Link
            key={l}
            href={l === "en" ? "/admin/texts" : "/admin/texts?lang=ar"}
            className={`px-4 py-2 text-sm rounded-md border ${lang === l ? "bg-[#A8975E] text-white border-[#A8975E]" : "bg-white text-gray-600 border-gray-200 hover:border-[#A8975E]"}`}
          >
            {label}
          </Link>
        ))}
        <span className="text-xs text-gray-400 ml-2">
          {lang === "ar" ? "Editing the wording customers see when they switch to Arabic." : "Editing the English wording."}
        </span>
      </div>
      <TextsClient key={lang} lang={lang} defs={defs} overrides={overrides} styles={styles} noStyle={NON_STYLEABLE_KEYS} />
    </AdminLayout>
  );
}
