import { redirect } from "next/navigation";
import AuthForm from "@/components/store/AuthForm";
import { getCustomer, safeNext } from "@/lib/customer-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await getCustomer()) redirect(target);
  return <AuthForm mode="login" next={target} />;
}
