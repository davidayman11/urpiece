import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import ShippingClient from "@/components/admin/ShippingClient";

export const dynamic = "force-dynamic";

export const metadata = { title: "Shipping" };

export default async function ShippingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  const zones = await prisma.shippingZone.findMany({ orderBy: [{ sortOrder: "asc" }, { city: "asc" }] });
  const settings = await prisma.paymentSettings.findFirst();
  return (
    <AdminLayout>
      <ShippingClient zones={zones} freeShippingMin={settings?.freeShippingMin ?? null} />
    </AdminLayout>
  );
}
