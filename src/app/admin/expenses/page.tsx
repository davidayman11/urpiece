import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import ExpensesClient from "@/components/admin/ExpensesClient";

export const metadata = { title: "Expenses" };

export default async function ExpensesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  return <AdminLayout><ExpensesClient /></AdminLayout>;
}
