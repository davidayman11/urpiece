import { redirect } from "next/navigation";
import AuthForm from "@/components/store/AuthForm";
import { getCustomer, safeNext } from "@/lib/customer-auth";
import { getT } from "@/lib/texts/server";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const t = await getT();
  return { title: t("account.register.metaTitle") };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const target = safeNext(next);
  if (await getCustomer()) redirect(target);
  return <AuthForm mode="register" next={target} />;
}
