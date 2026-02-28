import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { prisma } from "./auth";

export function authorize(...allowedRoles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = (req as any).userId;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const churchId = parseInt(req.headers["x-church-id"] as string) || undefined;

    const roles = await prisma.userChurchRole.findMany({
      where: {
        userId,
        ...(churchId ? { churchId } : {}),
      },
    });

    const hasRole = roles.some((r) => allowedRoles.includes(r.role));

    if (!hasRole) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    (req as any).churchId = churchId || roles[0]?.churchId;
    (req as any).userRoles = roles;
    next();
  };
}
