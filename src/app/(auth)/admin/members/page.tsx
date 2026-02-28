import { requirePermission, getUserDepartmentScope } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const session = await requirePermission("members:manage");
  const scope = getUserDepartmentScope(session);

  const churchIds = Array.from(
    new Set(session.user.churchRoles.map((r) => r.churchId))
  );

  const membersWhere = scope.scoped
    ? { departmentId: { in: scope.departmentIds } }
    : churchIds.length > 0
      ? { department: { ministry: { churchId: { in: churchIds } } } }
      : undefined;

  const departmentsWhere = scope.scoped
    ? { id: { in: scope.departmentIds } }
    : churchIds.length > 0
      ? { ministry: { churchId: { in: churchIds } } }
      : undefined;

  const members = await prisma.member.findMany({
    where: membersWhere,
    include: {
      department: {
        select: {
          id: true,
          name: true,
          ministry: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  const departments = await prisma.department.findMany({
    where: departmentsWhere,
    include: { ministry: { select: { id: true, name: true } } },
    orderBy: [{ ministry: { name: "asc" } }, { name: "asc" }],
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Membres</h1>
      <MembersClient
        initialMembers={members}
        departments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          ministryName: d.ministry.name,
        }))}
      />
    </div>
  );
}
