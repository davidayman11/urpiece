import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import SettingsClient from "@/components/admin/SettingsClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const settings = await prisma.paymentSettings.findFirst();
  return (
    <AdminLayout>
      <SettingsClient settings={settings} />
    </AdminLayout>
  );
}
