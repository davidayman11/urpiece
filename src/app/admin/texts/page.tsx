import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import TextsClient from "@/components/admin/TextsClient";
import { TEXT_DEFS } from "@/lib/texts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site Text" };

export default async function TextsAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const rows = await prisma.siteText.findMany();
  const overrides = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return (
    <AdminLayout>
      <TextsClient defs={TEXT_DEFS} overrides={overrides} />
    </AdminLayout>
  );
}
