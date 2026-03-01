import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";
import type { Session } from "next-auth";

function getMinisterMinistryIds(session: Session): string[] | null {
  const isGlobal = session.user.churchRoles.some((r) =>
    ["SUPER_ADMIN", "ADMIN"].includes(r.role)
  );
  if (isGlobal) return null; // no restriction
  return session.user.churchRoles
    .filter((r) => r.role === "MINISTER" && r.ministryId)
    .map((r) => r.ministryId as string);
}

export async function GET(request: Request) {
  try {
    await requirePermission("departments:view");
    const { searchParams } = new URL(request.url);
    const ministryId = searchParams.get("ministryId");
    const churchId = searchParams.get("churchId");

    const departments = await prisma.department.findMany({
      where: {
        ...(ministryId ? { ministryId } : {}),
        ...(churchId ? { ministry: { churchId } } : {}),
      },
      include: {
        ministry: { select: { id: true, name: true, churchId: true } },
      },
      orderBy: [{ ministry: { name: "asc" } }, { name: "asc" }],
    });

    return successResponse(departments);
  } catch (error) {
    return errorResponse(error);
  }
}

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, "Au moins un ID requis"),
  action: z.enum(["delete", "update"]),
  data: z.object({
    name: z.string().min(1).optional(),
    ministryId: z.string().min(1).optional(),
  }).optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await requirePermission("departments:manage");
    const body = await request.json();
    const { ids, action, data } = bulkSchema.parse(body);

    const allowedMinistries = getMinisterMinistryIds(session);
    if (allowedMinistries !== null) {
      const targetDepts = await prisma.department.findMany({
        where: { id: { in: ids } },
        select: { ministryId: true },
      });
      const allAllowed = targetDepts.every((d) => allowedMinistries.includes(d.ministryId));
      if (!allAllowed) {
        throw new ApiError(403, "Vous ne pouvez modifier que les départements de votre ministère");
      }
      if (data?.ministryId && !allowedMinistries.includes(data.ministryId)) {
        throw new ApiError(403, "Vous ne pouvez déplacer un département que vers votre ministère");
      }
    }

    if (action === "delete") {
      await prisma.$transaction(async (tx) => {
        const eventDeptIds = (
          await tx.eventDepartment.findMany({
            where: { departmentId: { in: ids } },
            select: { id: true },
          })
        ).map((ed) => ed.id);
        await tx.planning.deleteMany({ where: { eventDepartmentId: { in: eventDeptIds } } });
        await tx.planning.deleteMany({ where: { member: { departmentId: { in: ids } } } });
        await tx.eventDepartment.deleteMany({ where: { departmentId: { in: ids } } });
        await tx.member.deleteMany({ where: { departmentId: { in: ids } } });
        await tx.userDepartment.deleteMany({ where: { departmentId: { in: ids } } });
        await tx.department.deleteMany({ where: { id: { in: ids } } });
      });
      return successResponse({ deleted: ids.length });
    }

    if (!data || Object.keys(data).length === 0) {
      return errorResponse(new Error("Aucune donnée à mettre à jour"));
    }

    await prisma.department.updateMany({
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
  ministryId: z.string().min(1, "Le ministère est requis"),
});

export async function POST(request: Request) {
  try {
    const session = await requirePermission("departments:manage");
    const body = await request.json();
    const data = createSchema.parse(body);

    const allowedMinistries = getMinisterMinistryIds(session);
    if (allowedMinistries !== null && !allowedMinistries.includes(data.ministryId)) {
      throw new ApiError(403, "Vous ne pouvez créer un département que dans votre ministère");
    }

    const department = await prisma.department.create({
      data,
      include: {
        ministry: { select: { id: true, name: true, churchId: true } },
      },
    });

    return successResponse(department, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
