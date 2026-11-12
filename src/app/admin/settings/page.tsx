import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import SettingsClient from "@/components/admin/SettingsClient";
import DepositClient from "@/components/admin/DepositClient";
import ResetDataClient from "@/components/admin/ResetDataClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const [settings, depositRules] = await Promise.all([
    prisma.paymentSettings.findFirst(),
    prisma.depositRule.findMany({ orderBy: { minAmount: "asc" } }),
  ]);
  return (
    <AdminLayout>
      <div className="space-y-6">
        <DepositClient
          settings={{
            depositEnabled: settings?.depositEnabled ?? false,
            depositAllowFull: settings?.depositAllowFull ?? true,
            depositAddShipping: settings?.depositAddShipping ?? false,
          }}
          rules={depositRules}
        />
        <SettingsClient settings={settings} />
        <ResetDataClient />
      </div>
    </AdminLayout>
  );
}
