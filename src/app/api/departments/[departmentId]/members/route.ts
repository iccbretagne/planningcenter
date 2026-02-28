import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  try {
    await requireAuth();
    const { departmentId } = await params;

    const members = await prisma.member.findMany({
      where: { departmentId },
      orderBy: { lastName: "asc" },
    });

    return successResponse(members);
  } catch (error) {
    return errorResponse(error);
  }
}
