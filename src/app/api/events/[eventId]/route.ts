import { prisma } from "@/lib/prisma";
import { requireAuth, requirePermission } from "@/lib/auth";
import { successResponse, errorResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requireAuth();
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        eventDepts: {
          include: {
            department: {
              include: { ministry: true },
            },
          },
        },
      },
    });

    if (!event) {
      throw new ApiError(404, "Event not found");
    }

    return successResponse(event);
  } catch (error) {
    return errorResponse(error);
  }
}

const updateSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  type: z.string().min(1, "Le type est requis"),
  date: z.string().min(1, "La date est requise"),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requirePermission("events:manage");
    const { eventId } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const event = await prisma.event.update({
      where: { id: eventId },
      data: { ...data, date: new Date(data.date) },
      include: {
        church: { select: { id: true, name: true } },
        eventDepts: {
          include: { department: { select: { id: true, name: true } } },
        },
      },
    });

    return successResponse(event);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    await requirePermission("events:manage");
    const { eventId } = await params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new ApiError(404, "Evenement introuvable");
    }

    await prisma.event.delete({ where: { id: eventId } });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
