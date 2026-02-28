import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(request: Request) {
  try {
    await requirePermission("events:view");
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get("churchId");

    const events = await prisma.event.findMany({
      where: churchId ? { churchId } : undefined,
      include: {
        church: { select: { id: true, name: true } },
        eventDepts: {
          include: { department: { select: { id: true, name: true } } },
        },
      },
      orderBy: { date: "desc" },
    });

    return successResponse(events);
  } catch (error) {
    return errorResponse(error);
  }
}

const bulkSchema = z.object({
  ids: z.array(z.string()).min(1, "Au moins un ID requis"),
  action: z.enum(["delete", "update"]),
  data: z.object({
    title: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    date: z.string().min(1).optional(),
  }).optional(),
});

export async function PATCH(request: Request) {
  try {
    await requirePermission("events:manage");
    const body = await request.json();
    const { ids, action, data } = bulkSchema.parse(body);

    if (action === "delete") {
      await prisma.$transaction(async (tx) => {
        const eventDeptIds = (
          await tx.eventDepartment.findMany({
            where: { eventId: { in: ids } },
            select: { id: true },
          })
        ).map((ed) => ed.id);
        await tx.planning.deleteMany({ where: { eventDepartmentId: { in: eventDeptIds } } });
        await tx.eventDepartment.deleteMany({ where: { eventId: { in: ids } } });
        await tx.event.deleteMany({ where: { id: { in: ids } } });
      });
      return successResponse({ deleted: ids.length });
    }

    if (!data || Object.keys(data).length === 0) {
      return errorResponse(new Error("Aucune donnee a mettre a jour"));
    }

    const updateData: Record<string, unknown> = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }

    await prisma.event.updateMany({
      where: { id: { in: ids } },
      data: updateData,
    });

    return successResponse({ updated: ids.length });
  } catch (error) {
    return errorResponse(error);
  }
}

const createSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  type: z.string().min(1, "Le type est requis"),
  date: z.string().min(1, "La date est requise"),
  churchId: z.string().min(1, "L'eglise est requise"),
});

export async function POST(request: Request) {
  try {
    await requirePermission("events:manage");
    const body = await request.json();
    const data = createSchema.parse(body);

    const event = await prisma.event.create({
      data: {
        ...data,
        date: new Date(data.date),
      },
      include: {
        church: { select: { id: true, name: true } },
        eventDepts: {
          include: { department: { select: { id: true, name: true } } },
        },
      },
    });

    return successResponse(event, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
