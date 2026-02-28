import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const roleSchema = z.object({
  churchId: z.string().min(1),
  role: z.enum([
    "SUPER_ADMIN",
    "ADMIN",
    "SECRETARY",
    "MINISTER",
    "DEPARTMENT_HEAD",
  ]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requirePermission("users:manage");
    const { userId } = await params;
    const body = await request.json();
    const { churchId, role } = roleSchema.parse(body);

    const userRole = await prisma.userChurchRole.create({
      data: { userId, churchId, role },
      include: {
        church: { select: { id: true, name: true } },
      },
    });

    return successResponse(userRole, 201);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requirePermission("users:manage");
    const { userId } = await params;
    const body = await request.json();
    const { churchId, role } = roleSchema.parse(body);

    await prisma.userChurchRole.delete({
      where: {
        userId_churchId_role: { userId, churchId, role },
      },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
