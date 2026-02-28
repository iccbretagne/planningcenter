import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DepartmentsClient from "./DepartmentsClient";

export default async function DepartmentsPage() {
  const session = await requirePermission("departments:manage");

  const churchRoles = session.user.churchRoles;
  const isSuperAdmin = churchRoles.some((r) => r.role === "SUPER_ADMIN");
  const churchIds = Array.from(new Set(churchRoles.map((r) => r.churchId)));

  const departments = await prisma.department.findMany({
    where: isSuperAdmin
      ? undefined
      : { ministry: { churchId: { in: churchIds } } },
    include: {
      ministry: { select: { id: true, name: true, churchId: true } },
      _count: { select: { members: true } },
    },
    orderBy: [{ ministry: { name: "asc" } }, { name: "asc" }],
  });

  const ministries = await prisma.ministry.findMany({
    where: isSuperAdmin
      ? undefined
      : { churchId: { in: churchIds } },
    include: { church: { select: { id: true, name: true } } },
    orderBy: [{ church: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Départements</h1>
      <DepartmentsClient
        initialDepartments={departments}
        ministries={ministries.map((m) => ({
          id: m.id,
          name: m.name,
          churchName: m.church.name,
        }))}
      />
    </div>
  );
}
