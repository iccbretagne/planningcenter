import { Router, Request, Response } from "express";
import { authenticateJwt, prisma } from "../middleware/auth";

const router = Router();

// Get members of a department
router.get(
  "/departments/:id/members",
  authenticateJwt,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const departmentId = parseInt(req.params.id as string);
      const members = await prisma.member.findMany({
        where: { departmentId },
        orderBy: { lastName: "asc" },
      });
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get planning for a department at an event
router.get(
  "/events/:eventId/departments/:deptId/planning",
  authenticateJwt,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const eventId = parseInt(req.params.eventId as string);
      const departmentId = parseInt(req.params.deptId as string);

      const eventDept = await prisma.eventDepartment.findUnique({
        where: {
          eventId_departmentId: { eventId, departmentId },
        },
        include: {
          plannings: {
            include: { member: true },
          },
          department: {
            include: { members: { orderBy: { lastName: "asc" } } },
          },
        },
      });

      if (!eventDept) {
        res.status(404).json({ error: "Event-department link not found" });
        return;
      }

      // Return all members with their planning status
      const members = eventDept.department.members.map((member) => {
        const planning = eventDept.plannings.find(
          (p) => p.memberId === member.id
        );
        return {
          ...member,
          status: planning?.status || null,
          planningId: planning?.id || null,
        };
      });

      res.json({ eventDepartment: eventDept, members });
    } catch (error) {
      console.error("Error fetching planning:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update planning for a department at an event
router.put(
  "/events/:eventId/departments/:deptId/planning",
  authenticateJwt,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const eventId = parseInt(req.params.eventId as string);
      const departmentId = parseInt(req.params.deptId as string);
      const { plannings } = req.body as {
        plannings: Array<{
          memberId: number;
          status: string | null;
        }>;
      };

      // Find or create event-department link
      let eventDept = await prisma.eventDepartment.findUnique({
        where: {
          eventId_departmentId: { eventId, departmentId },
        },
      });

      if (!eventDept) {
        eventDept = await prisma.eventDepartment.create({
          data: { eventId, departmentId },
        });
      }

      // Validate: only one EN_SERVICE_DEBRIEF per department per event
      const debriefCount = plannings.filter(
        (p) => p.status === "EN_SERVICE_DEBRIEF"
      ).length;
      if (debriefCount > 1) {
        res.status(400).json({
          error: "Only one member can have EN_SERVICE_DEBRIEF status per department per event",
        });
        return;
      }

      // Upsert each planning entry
      const results = await Promise.all(
        plannings.map((p) =>
          prisma.planning.upsert({
            where: {
              eventDepartmentId_memberId: {
                eventDepartmentId: eventDept!.id,
                memberId: p.memberId,
              },
            },
            update: { status: p.status as any },
            create: {
              eventDepartmentId: eventDept!.id,
              memberId: p.memberId,
              status: p.status as any,
            },
          })
        )
      );

      res.json(results);
    } catch (error) {
      console.error("Error updating planning:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
