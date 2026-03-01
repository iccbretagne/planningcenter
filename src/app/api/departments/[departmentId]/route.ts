import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";
import type { Session } from "next-auth";

function getMinisterMinistryIds(session: Session): string[] | null {
  const isGlobal = session.user.churchRoles.some((r) =>
    ["SUPER_ADMIN", "ADMIN"].includes(r.role)
  );
  if (isGlobal) return null;
  return session.user.churchRoles
    .filter((r) => r.role === "MINISTER" && r.ministryId)
    .map((r) => r.ministryId as string);
}

async function checkDepartmentScope(session: Session, departmentId: string) {
  const allowedMinistries = getMinisterMinistryIds(session);
  if (allowedMinistries === null) return;
  const dept = await prisma.department.findUnique({
    where: { id: departmentId },
    select: { ministryId: true },
  });
  if (!dept || !allowedMinistries.includes(dept.ministryId)) {
    throw new ApiError(403, "Vous ne pouvez modifier que les départements de votre ministère");
  }
}

const updateSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    const session = await requirePermission("departments:manage");
    const { departmentId } = await params;
    await checkDepartmentScope(session, departmentId);
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
    const session = await requirePermission("departments:manage");
    const { departmentId } = await params;
    await checkDepartmentScope(session, departmentId);

    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      include: { members: true },
    });

    if (!department) {
      throw new ApiError(404, "Département introuvable");
    }

    if (department.members.length > 0) {
      throw new ApiError(
        400,
        "Impossible de supprimer un département qui contient des STAR"
      );
    }

    await prisma.department.delete({ where: { id: departmentId } });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
