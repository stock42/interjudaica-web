import { requireOperator } from "@/services/auth";

export const runtime = "nodejs";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireOperator();

  return children;
}

