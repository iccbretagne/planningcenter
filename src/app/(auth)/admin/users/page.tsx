import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export default async function UsersPage() {
  const session = await requirePermission("members:manage");

  const churchRoles = session.user.churchRoles;
  const isSuperAdmin = churchRoles.some((r) => r.role === "SUPER_ADMIN");
  const churchIds = Array.from(new Set(churchRoles.map((r) => r.churchId)));

  const users = await prisma.user.findMany({
    where: isSuperAdmin
      ? undefined
      : { churchRoles: { some: { churchId: { in: churchIds } } } },
    include: {
      churchRoles: {
        include: { church: { select: { id: true, name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });

  const churches = isSuperAdmin
    ? await prisma.church.findMany({ orderBy: { name: "asc" } })
    : churchRoles.map((r) => r.church);

  const uniqueChurches = Array.from(
    new Map(churches.map((c) => [c.id, c])).values()
  );

  const canManageRoles = isSuperAdmin || churchRoles.some((r) => r.role === "ADMIN");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Utilisateurs</h1>
      <UsersClient
        initialUsers={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          image: u.image,
          churchRoles: u.churchRoles.map((r) => ({
            id: r.id,
            role: r.role,
            church: r.church,
          })),
        }))}
        churches={uniqueChurches.map((c) => ({ id: c.id, name: c.name }))}
        canManageRoles={canManageRoles}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
