import { redirect } from "next/navigation";
import AuthForm from "@/components/store/AuthForm";
import { getCustomer, safeNext } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create account" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await getCustomer()) redirect(target);
  return <AuthForm mode="register" next={target} />;
}
