import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

// Checkout requires an account
export default async function CheckoutLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomer();
  if (!customer) redirect("/account/login?next=/checkout");
  return <>{children}</>;
}
