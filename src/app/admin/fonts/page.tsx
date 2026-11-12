import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import FontsClient from "@/components/admin/FontsClient";
import { getFontSettings } from "@/lib/font-settings";
import { FONT_CATALOG, buildFontsUrl } from "@/lib/fonts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Fonts" };

export default async function FontsAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const { config } = await getFontSettings();
  // every catalog font is loaded here so the previews show the real letters
  const previewUrl = buildFontsUrl(FONT_CATALOG.filter((f) => !f.preloaded).map((f) => f.name));
  return (
    <AdminLayout>
      {previewUrl && <link rel="stylesheet" href={previewUrl} precedence="default" />}
      <FontsClient initial={config} />
    </AdminLayout>
  );
}
