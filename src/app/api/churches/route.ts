import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

export async function GET() {
  try {
    await requirePermission("church:manage");

    const churches = await prisma.church.findMany({
      include: {
        _count: { select: { users: true, ministries: true, events: true } },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(churches);
  } catch (error) {
    return errorResponse(error);
  }
}

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, "Au moins un ID requis"),
  action: z.enum(["delete", "update"]),
  data: z.object({
    name: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
  }).optional(),
});

export async function PATCH(request: Request) {
  try {
    await requirePermission("church:manage");
    const body = await request.json();
    const { ids, action, data } = bulkSchema.parse(body);

    if (action === "delete") {
      await prisma.$transaction(async (tx) => {
        const ministryIds = (
          await tx.ministry.findMany({ where: { churchId: { in: ids } }, select: { id: true } })
        ).map((m) => m.id);
        const deptIds = ministryIds.length > 0
          ? (await tx.department.findMany({ where: { ministryId: { in: ministryIds } }, select: { id: true } })).map((d) => d.id)
          : [];
        if (deptIds.length > 0) {
          const eventDeptIds = (
            await tx.eventDepartment.findMany({ where: { departmentId: { in: deptIds } }, select: { id: true } })
          ).map((ed) => ed.id);
          await tx.planning.deleteMany({ where: { eventDepartmentId: { in: eventDeptIds } } });
          await tx.planning.deleteMany({ where: { member: { departmentId: { in: deptIds } } } });
          await tx.eventDepartment.deleteMany({ where: { departmentId: { in: deptIds } } });
          await tx.member.deleteMany({ where: { departmentId: { in: deptIds } } });
          await tx.userDepartment.deleteMany({ where: { departmentId: { in: deptIds } } });
        }
        // Also delete event departments linked via events of these churches
        const eventIds = (
          await tx.event.findMany({ where: { churchId: { in: ids } }, select: { id: true } })
        ).map((e) => e.id);
        if (eventIds.length > 0) {
          const evtDeptIds = (
            await tx.eventDepartment.findMany({ where: { eventId: { in: eventIds } }, select: { id: true } })
          ).map((ed) => ed.id);
          await tx.planning.deleteMany({ where: { eventDepartmentId: { in: evtDeptIds } } });
          await tx.eventDepartment.deleteMany({ where: { eventId: { in: eventIds } } });
        }
        if (deptIds.length > 0) {
          await tx.department.deleteMany({ where: { ministryId: { in: ministryIds } } });
        }
        if (ministryIds.length > 0) {
          await tx.ministry.deleteMany({ where: { churchId: { in: ids } } });
        }
        await tx.event.deleteMany({ where: { churchId: { in: ids } } });
        // Clean up user roles
        const roleIds = (
          await tx.userChurchRole.findMany({ where: { churchId: { in: ids } }, select: { id: true } })
        ).map((r) => r.id);
        if (roleIds.length > 0) {
          await tx.userDepartment.deleteMany({ where: { userChurchRoleId: { in: roleIds } } });
        }
        await tx.userChurchRole.deleteMany({ where: { churchId: { in: ids } } });
        await tx.church.deleteMany({ where: { id: { in: ids } } });
      });
      return successResponse({ deleted: ids.length });
    }

    if (!data || Object.keys(data).length === 0) {
      return errorResponse(new Error("Aucune donnée à mettre à jour"));
    }

    await prisma.church.updateMany({
      where: { id: { in: ids } },
      data,
    });

    return successResponse({ updated: ids.length });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  slug: z.string().min(1, "Le slug est requis"),
});

export async function POST(request: Request) {
  try {
    await requirePermission("church:manage");
    const body = await request.json();
    const data = createSchema.parse(body);

    const church = await prisma.church.create({ data });

    return successResponse(church, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
