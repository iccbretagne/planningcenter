import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const schema = z.object({
  departmentId: z.string().min(1, "Le departement est requis"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requirePermission("events:manage");
    const { eventId } = await params;
    const body = await request.json();
    const { departmentId } = schema.parse(body);

    const eventDept = await prisma.eventDepartment.create({
      data: { eventId, departmentId },
      include: { department: { select: { id: true, name: true } } },
    });

    return successResponse(eventDept, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requirePermission("events:manage");
    const { eventId } = await params;
    const body = await request.json();
    const { departmentId } = schema.parse(body);

    await prisma.eventDepartment.delete({
      where: {
        eventId_departmentId: { eventId, departmentId },
      },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
