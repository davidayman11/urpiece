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
  const [governorates, unassigned, settings] = await Promise.all([
    prisma.governorate.findMany({
      include: { zones: { orderBy: [{ sortOrder: "asc" }, { city: "asc" }] } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.shippingZone.findMany({ where: { governorateId: null }, orderBy: [{ sortOrder: "asc" }, { city: "asc" }] }),
    prisma.paymentSettings.findFirst(),
  ]);
  return (
    <AdminLayout>
      <ShippingClient
        governorates={governorates}
        unassigned={unassigned}
        freeShippingMin={settings?.freeShippingMin ?? null}
      />
    </AdminLayout>
  );
}
