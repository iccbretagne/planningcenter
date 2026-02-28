import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";

export default async function AdminPage() {
  const session = await requirePermission("members:manage");

  const userRoles = session.user.churchRoles.map((r) => r.role);
  const userPermissions = new Set(userRoles.flatMap((r) => hasPermission(r)));

  if (userPermissions.has("church:manage")) {
    redirect("/admin/churches");
  }

  redirect("/admin/users");
}
