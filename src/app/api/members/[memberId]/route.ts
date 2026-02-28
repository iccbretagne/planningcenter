import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth";
import { successResponse, errorResponse, ApiError } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  firstName: z.string().min(1, "Le prenom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  departmentId: z.string().min(1, "Le departement est requis"),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await requirePermission("members:manage");
    const { memberId } = await params;
    const body = await request.json();
    const data = updateSchema.parse(body);

    const member = await prisma.member.update({
      where: { id: memberId },
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

    return successResponse(member);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  try {
    await requirePermission("members:manage");
    const { memberId } = await params;

    const member = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new ApiError(404, "Membre introuvable");
    }

    await prisma.member.delete({ where: { id: memberId } });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
