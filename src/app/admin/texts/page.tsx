import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import TextsClient from "@/components/admin/TextsClient";
import { TEXT_DEFS } from "@/lib/texts";
import { getFontSettings } from "@/lib/font-settings";
import { FONT_CATALOG, buildFontsUrl } from "@/lib/fonts";
import { NON_STYLEABLE_KEYS } from "@/lib/texts/non-styleable";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Text" };

export default async function TextsAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const rows = await prisma.siteText.findMany();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const { styles } = await getFontSettings();
  const previewUrl = buildFontsUrl(FONT_CATALOG.filter((f) => !f.preloaded).map((f) => f.name));
  return (
    <AdminLayout>
      {previewUrl && <link rel="stylesheet" href={previewUrl} precedence="default" />}
      <TextsClient defs={TEXT_DEFS} overrides={overrides} styles={styles} noStyle={NON_STYLEABLE_KEYS} />
    </AdminLayout>
  );
}
