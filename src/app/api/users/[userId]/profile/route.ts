import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, ApiError } from "@/lib/api-utils";

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await requireAuth();
    const { userId } = await params;

    // User can edit own profile, or admin/super_admin/secretary can edit any
    const isSelf = session.user.id === userId;
    const isAdmin = session.user.churchRoles.some((r) =>
      ["SUPER_ADMIN", "ADMIN", "SECRETARY"].includes(r.role)
    );

    if (!isSelf && !isAdmin) {
      throw new ApiError(403, "Non autorisé");
    }

    const data = updateProfileSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id: userId },
      data: { displayName: data.displayName },
      select: { id: true, displayName: true },
    });

    return successResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}
