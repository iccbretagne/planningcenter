import type { Role } from "@prisma/client";

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: [
    "planning:view",
    "planning:edit",
    "members:view",
    "members:manage",
    "events:view",
    "events:manage",
    "departments:view",
    "departments:manage",
    "church:manage",
    "users:manage",
  ],
  ADMIN: [
    "planning:view",
    "planning:edit",
    "members:view",
    "members:manage",
    "events:view",
    "events:manage",
    "departments:view",
    "departments:manage",
  ],
  SECRETARY: [
    "planning:view",
    "planning:edit",
    "members:view",
    "events:view",
    "departments:view",
  ],
  MINISTER: [
    "planning:view",
    "planning:edit",
    "members:view",
    "members:manage",
    "events:view",
    "departments:view",
  ],
  DEPARTMENT_HEAD: [
    "planning:view",
    "planning:edit",
    "members:view",
    "members:manage",
    "events:view",
    "departments:view",
  ],
};

export function hasPermission(role: Role): string[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function userHasAnyRole(
  userRoles: { role: Role; churchId: string }[],
  allowedRoles: Role[],
  churchId?: string
): boolean {
  return userRoles.some(
    (r) =>
      allowedRoles.includes(r.role) && (!churchId || r.churchId === churchId)
  );
}
