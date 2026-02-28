import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      image: string | null;
      churchRoles: {
        id: string;
        churchId: string;
        role: Role;
        church: { id: string; name: string; slug: string };
        departments: {
          department: { id: string; name: string };
        }[];
      }[];
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/",
  },
  events: {
    async createUser({ user }) {
      if (!user.email || !user.id) return;

      const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (superAdminEmails.includes(user.email.toLowerCase())) {
        const churches = await prisma.church.findMany();
        for (const church of churches) {
          await prisma.userChurchRole.create({
            data: {
              userId: user.id,
              churchId: church.id,
              role: "SUPER_ADMIN",
            },
          });
        }
      }
    },
  },
  callbacks: {
    async session({ session, user }) {
      session.user.id = user.id;

      const churchRoles = await prisma.userChurchRole.findMany({
        where: { userId: user.id },
        include: {
          church: { select: { id: true, name: true, slug: true } },
          departments: {
            include: {
              department: { select: { id: true, name: true } },
            },
          },
        },
      });

      session.user.churchRoles = churchRoles;

      return session;
    },
  },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requirePermission(permission: string, churchId?: string) {
  const session = await requireAuth();

  const roles = session.user.churchRoles.filter(
    (r) => !churchId || r.churchId === churchId
  );

  const { hasPermission } = await import("./permissions");
  const userPermissions = new Set(
    roles.flatMap((r) => hasPermission(r.role))
  );

  if (!userPermissions.has(permission)) {
    throw new Error("FORBIDDEN");
  }

  return session;
}
