import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCustomer } from "@/lib/customer-auth";
import AccountClient from "@/components/store/AccountClient";
import { loadShipping } from "@/lib/shipping";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account" };

export default async function AccountPage() {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login?next=/account");

  const [addresses, shipping, orderCount] = await Promise.all([
    prisma.address.findMany({ where: { customerId: customer.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
    loadShipping(),
    prisma.order.count({
      where: { customerId: customer.id, ...(customer.registeredAt ? { createdAt: { gte: customer.registeredAt } } : {}) },
    }),
  ]);

  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#A8975E] mb-2">My account</p>
            <h1 className="font-serif text-4xl font-light text-[#1C1711]">Hello, {customer.name.split(" ")[0]}</h1>
          </div>
          <Link
            href="/orders"
            className="text-[11px] tracking-[0.2em] uppercase text-[#5A5040] border-b border-[#5A5040]/30 pb-0.5 hover:text-[#A8975E] hover:border-[#A8975E] transition-colors"
          >
            My orders ({orderCount})
          </Link>
        </div>
        <AccountClient
          customer={{ name: customer.name, email: customer.email, phone: customer.phone || "" }}
          addresses={addresses}
          shipping={shipping}
        />
      </div>
    </div>
  );
}
