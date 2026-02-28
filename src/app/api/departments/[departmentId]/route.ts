import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requirePermission("departments:manage");
    const { departmentId } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const department = await prisma.department.update({
      where: { id: departmentId },
      data,
      include: {
        ministry: { select: { id: true, name: true, churchId: true } },
      },
    });

    return successResponse(department);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requirePermission("departments:manage");
    const { departmentId } = await params;

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { members: true },
    });

    if (!department) {
      throw new ApiError(404, "Departement introuvable");
    }

    if (department.members.length > 0) {
      throw new ApiError(
        400,
        "Impossible de supprimer un departement qui contient des membres"
      );
    }

    await prisma.department.delete({ where: { id: departmentId } });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
