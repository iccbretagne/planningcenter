import { prisma } from "@/lib/prisma";
import { requirePermission, getUserDepartmentScope } from "@/lib/auth";
import { successResponse, errorResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    const session = await requirePermission("members:view");
    const scope = getUserDepartmentScope(session);
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const churchId = searchParams.get("churchId");

    if (scope.scoped && departmentId && !scope.departmentIds.includes(departmentId)) {
      throw new ApiError(403, "Accès refusé à ce département");
    }

    const members = await prisma.member.findMany({
      where: {
        ...(departmentId
          ? { departmentId }
          : scope.scoped
            ? { departmentId: { in: scope.departmentIds } }
            : {}),
        ...(churchId && !scope.scoped
          ? { department: { ministry: { churchId } } }
          : {}),
      },
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

    return successResponse(members);
  } catch (error) {
    return errorResponse(error);
  }
}

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, "Au moins un ID requis"),
  action: z.enum(["delete", "update"]),
  data: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    departmentId: z.string().min(1).optional(),
  }).optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await requirePermission("members:manage");
    const scope = getUserDepartmentScope(session);
    const body = await request.json();
    const { ids, action, data } = bulkSchema.parse(body);

    if (scope.scoped) {
      const members = await prisma.member.findMany({
        where: { id: { in: ids } },
        select: { departmentId: true },
      });

      const allInScope = members.every((m) =>
        scope.departmentIds.includes(m.departmentId)
      );
      if (!allInScope) {
        throw new ApiError(403, "Certains STAR sont hors de votre périmètre");
      }

      if (action === "update" && data?.departmentId && !scope.departmentIds.includes(data.departmentId)) {
        throw new ApiError(403, "Département cible non autorisé");
      }
    }

    if (action === "delete") {
      await prisma.$transaction([
        prisma.planning.deleteMany({ where: { memberId: { in: ids } } }),
        prisma.member.deleteMany({ where: { id: { in: ids } } }),
      ]);
      return successResponse({ deleted: ids.length });
    }

    if (!data || Object.keys(data).length === 0) {
      return errorResponse(new Error("Aucune donnée à mettre à jour"));
    }

    await prisma.member.updateMany({
      where: { id: { in: ids } },
      data,
    });

    return successResponse({ updated: ids.length });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  departmentId: z.string().min(1, "Le département est requis"),
});

export async function POST(request: Request) {
  try {
    const session = await requirePermission("members:manage");
    const scope = getUserDepartmentScope(session);
    const body = await request.json();
    const data = createSchema.parse(body);

    if (scope.scoped && !scope.departmentIds.includes(data.departmentId)) {
      throw new ApiError(403, "Vous ne pouvez pas créer un STAR dans ce département");
    }

    const member = await prisma.member.create({
      data,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            ministry: { select: { id: true, name: true } },
          },
        },
      },
    });

    return successResponse(member, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
