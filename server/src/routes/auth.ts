import { Router, Request, Response } from "express";
import passport from "passport";
import { authenticateJwt, signToken, prisma } from "../middleware/auth";

const router = Router();

// Initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req: Request, res: Response) => {
    const user = req.user;
    if (!user) {
      res.redirect("/login?error=auth_failed");
      return;
    }
    const token = signToken(user);
    res.redirect(
      `${process.env.APP_URL || "http://localhost:5173"}/auth/callback?token=${token}`
    );
  }
);

// Exchange Google token from frontend (alternative flow)
router.post("/google", async (req: Request, res: Response): Promise<void> => {
  const { googleId, email, name, avatarUrl } = req.body;

  if (!googleId || !email || !name) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  try {
    let user = await prisma.user.findUnique({
      where: { googleId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { email, name, avatarUrl: avatarUrl || null, googleId },
      });

      // Auto-activate super admin
      const superAdminEmails = (process.env.SUPER_ADMIN_EMAIL || "")
        .split(",")
        .map((e) => e.trim().toLowerCase());

      if (superAdminEmails.includes(email.toLowerCase())) {
        const churches = await prisma.church.findMany();
        for (const church of churches) {
          await prisma.userChurchRole.upsert({
            where: {
              userId_churchId_role: {
                userId: user.id,
                churchId: church.id,
                role: "SUPER_ADMIN",
              },
            },
            update: {},
            create: {
              userId: user.id,
              churchId: church.id,
              role: "SUPER_ADMIN",
            },
          });
        }
      }
    }

    const token = signToken(user);
    res.json({ token, user });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Get current user
router.get("/me", authenticateJwt, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        churchRoles: {
          include: {
            church: true,
            ministry: true,
            departments: {
              include: { department: true },
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
