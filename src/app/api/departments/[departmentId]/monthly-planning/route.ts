import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAuth();
    const { departmentId } = await params;

    const url = new URL(request.url);
    const monthParam = url.searchParams.get("month");

    // Default to current month
    const now = new Date();
    const year = monthParam
      ? parseInt(monthParam.split("-")[0])
      : now.getFullYear();
    const month = monthParam
      ? parseInt(monthParam.split("-")[1]) - 1
      : now.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

    const eventDepartments = await prisma.eventDepartment.findMany({
      where: {
        departmentId,
        event: {
          date: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
      },
      include: {
        event: true,
        plannings: {
          where: {
            status: { in: ["EN_SERVICE", "EN_SERVICE_DEBRIEF"] },
          },
          include: {
            member: true,
          },
        },
      },
      orderBy: {
        event: { date: "asc" },
      },
    });

    const events = eventDepartments.map((ed) => ({
      id: ed.event.id,
      title: ed.event.title,
      date: ed.event.date.toISOString(),
      members: ed.plannings.map((p) => ({
        id: p.member.id,
        firstName: p.member.firstName,
        lastName: p.member.lastName,
        status: p.status,
      })),
    }));

    return successResponse({ events });
  } catch (error) {
    return errorResponse(error);
  }
}
