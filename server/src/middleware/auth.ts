import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface JwtPayload {
  userId: number;
  email: string;
}

declare global {
  namespace Express {
    interface User {
      id: number;
      email: string;
      name: string;
      avatarUrl: string | null;
      googleId: string;
    }
  }
}

export function configurePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        callbackURL: `${process.env.APP_URL || "http://localhost:5173"}/api/auth/google/callback`,
        proxy: true,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          let user = await prisma.user.findUnique({
            where: { googleId: profile.id },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value || null,
                googleId: profile.id,
              },
            });

            // Auto-activate super admin
            const superAdminEmails = (process.env.SUPER_ADMIN_EMAIL || "")
              .split(",")
              .map((e) => e.trim().toLowerCase());

            if (superAdminEmails.includes(email.toLowerCase())) {
              // Assign SUPER_ADMIN to all existing churches
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
          }

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      }
    )
  );
}

export function authenticateJwt(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;

  if (!token) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret"
    ) as JwtPayload;
    (req as any).userId = payload.userId;
    (req as any).userEmail = payload.email;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function signToken(user: { id: number; email: string }): string {
  return jwt.sign(
    { userId: user.id, email: user.email } as JwtPayload,
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" }
  );
}

export { prisma };
