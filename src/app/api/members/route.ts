import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    await requirePermission("members:view");
    const { searchParams } = new URL(request.url);
    const departmentId = searchParams.get("departmentId");
    const churchId = searchParams.get("churchId");

    const members = await prisma.member.findMany({
      where: {
        ...(departmentId ? { departmentId } : {}),
        ...(churchId ? { department: { ministry: { churchId } } } : {}),
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
    await requirePermission("members:manage");
    const body = await request.json();
    const { ids, action, data } = bulkSchema.parse(body);

    if (action === "delete") {
      await prisma.$transaction([
        prisma.planning.deleteMany({ where: { memberId: { in: ids } } }),
        prisma.member.deleteMany({ where: { id: { in: ids } } }),
      ]);
      return successResponse({ deleted: ids.length });
    }

    if (!data || Object.keys(data).length === 0) {
      return errorResponse(new Error("Aucune donnee a mettre a jour"));
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
  firstName: z.string().min(1, "Le prenom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  departmentId: z.string().min(1, "Le departement est requis"),
});

export async function POST(request: Request) {
  try {
    await requirePermission("members:manage");
    const body = await request.json();
    const data = createSchema.parse(body);

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
