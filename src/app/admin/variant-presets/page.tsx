import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import VariantPresetsClient from "@/components/admin/VariantPresetsClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Variant Presets" };

export default async function VariantPresetsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const raw = await prisma.variantPreset.findMany({ orderBy: { createdAt: "asc" } });
  const presets = raw.map((p) => ({
    id: p.id,
    name: p.name,
    values: (() => { try { return JSON.parse(p.values) as string[]; } catch { return [] as string[]; } })(),
  }));

  return (
    <AdminLayout>
      <VariantPresetsClient presets={presets} />
    </AdminLayout>
  );
}
