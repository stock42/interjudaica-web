import { requireOperator } from "@/services/auth";
import { AdminLayoutClient } from "@/app/admin/components/admin-layout-client";

export const runtime = "nodejs";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireOperator();

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
