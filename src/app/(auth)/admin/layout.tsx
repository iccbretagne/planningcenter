import { requireAnyPermission } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAnyPermission(
    "members:manage",
    "church:manage",
    "users:manage",
    "departments:manage"
  );

  return <div className="p-6">{children}</div>;
}
