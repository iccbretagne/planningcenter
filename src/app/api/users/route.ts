import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    await requirePermission("members:manage");
    const { searchParams } = new URL(request.url);
    const churchId = searchParams.get("churchId");

    const users = await prisma.user.findMany({
      where: churchId
        ? { churchRoles: { some: { churchId } } }
        : undefined,
      include: {
        churchRoles: {
          include: {
            church: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return successResponse(users);
  } catch (error) {
    return errorResponse(error);
  }
}
