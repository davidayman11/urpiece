import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import ReportsClient from "@/components/admin/ReportsClient";

export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/admin/login");
  return <AdminLayout><ReportsClient /></AdminLayout>;
}
