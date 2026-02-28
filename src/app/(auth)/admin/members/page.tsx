import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MembersClient from "./MembersClient";

export default async function MembersPage() {
  const session = await requirePermission("members:manage");

  const churchRoles = session.user.churchRoles;
  const isSuperAdmin = churchRoles.some((r) => r.role === "SUPER_ADMIN");
  const churchIds = Array.from(new Set(churchRoles.map((r) => r.churchId)));

  const members = await prisma.member.findMany({
    where: isSuperAdmin
      ? undefined
      : { department: { ministry: { churchId: { in: churchIds } } } },
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
    where: isSuperAdmin
      ? undefined
      : { ministry: { churchId: { in: churchIds } } },
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
