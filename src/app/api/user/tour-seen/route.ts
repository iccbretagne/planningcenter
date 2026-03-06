import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function PATCH() {
  try {
    const session = await requireAuth();

    await prisma.user.update({
      where: { id: session.user.id },
      data: { hasSeenTour: true },
    });

    return successResponse({ hasSeenTour: true });
  } catch (error) {
    return errorResponse(error);
  }
}
