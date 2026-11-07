import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminLayout from "@/components/admin/AdminLayout";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");

  const customers = await prisma.customer.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-800">Customers</h1>
          <span className="text-sm text-gray-500">{customers.length} total</span>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-50 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 text-xs text-gray-500 font-medium">Name</th>
                <th className="text-left p-4 text-xs text-gray-500 font-medium">Email</th>
                <th className="text-left p-4 text-xs text-gray-500 font-medium">Phone</th>
                <th className="text-left p-4 text-xs text-gray-500 font-medium">Orders</th>
                <th className="text-left p-4 text-xs text-gray-500 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {customers.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-gray-400">No customers yet</td></tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="p-4 font-medium text-gray-800">{c.name}</td>
                    <td className="p-4 text-gray-600">{c.email}</td>
                    <td className="p-4 text-gray-500">{c.phone || "—"}</td>
                    <td className="p-4 text-gray-500">{c._count.orders}</td>
                    <td className="p-4 text-gray-500 text-xs">{format(new Date(c.createdAt), "d MMM yyyy")}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
