import { Router, Request, Response } from "express";
import { authenticateJwt, prisma } from "../middleware/auth";

const router = Router();

// List events for a church
router.get(
  "/churches/:id/events",
  authenticateJwt,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const churchId = parseInt(req.params.id as string);
      const events = await prisma.event.findMany({
        where: { churchId },
        orderBy: { date: "asc" },
        include: {
          eventDepts: {
            include: { department: true },
          },
        },
      });
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get event detail
router.get(
  "/events/:id",
  authenticateJwt,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const eventId = parseInt(req.params.id as string);
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          eventDepts: {
            include: {
              department: {
                include: { ministry: true },
              },
            },
          },
        },
      });

      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
