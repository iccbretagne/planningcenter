import { requirePermission } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePermission("members:manage");

  return <div className="p-6">{children}</div>;
}
