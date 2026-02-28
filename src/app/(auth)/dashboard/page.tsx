import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EventSelector from "@/components/EventSelector";
import PlanningGrid from "@/components/PlanningGrid";
import DashboardActions from "@/components/DashboardActions";
import MonthlyPlanningView from "@/components/MonthlyPlanningView";

interface DashboardProps {
  searchParams: Promise<{ dept?: string; event?: string; view?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const {
    dept: selectedDeptId,
    event: selectedEventId,
    view = "event",
  } = await searchParams;

  const currentChurchId = session.user.churchRoles[0]?.churchId;

  if (!currentChurchId) {
    return (
      <div className="p-8 text-center text-gray-400 border-2 border-gray-200 border-dashed rounded-lg">
        Vous n&apos;etes assigne a aucune eglise.
      </div>
    );
  }

  // Fetch events for the church (needed for event view)
  const events =
    view === "event"
      ? await prisma.event.findMany({
          where: { churchId: currentChurchId },
          orderBy: { date: "asc" },
          include: {
            eventDepts: {
              include: { department: true },
            },
          },
        })
      : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <DashboardActions />
      </div>

      {view === "event" && (
        <div className="mb-6">
          <EventSelector
            events={events.map((e) => ({
              id: e.id,
              title: e.title,
              type: e.type,
              date: e.date.toISOString(),
            }))}
            selectedEventId={selectedEventId || null}
            selectedDeptId={selectedDeptId || null}
          />
        </div>
      )}

      {view === "month" ? (
        selectedDeptId ? (
          <MonthlyPlanningView departmentId={selectedDeptId} />
        ) : (
          <div className="p-8 text-center text-gray-400 border-2 border-gray-200 border-dashed rounded-lg">
            Selectionnez un departement dans la barre laterale
          </div>
        )
      ) : selectedEventId && selectedDeptId ? (
        <PlanningGrid eventId={selectedEventId} departmentId={selectedDeptId} />
      ) : (
        <div className="p-8 text-center text-gray-400 border-2 border-gray-200 border-dashed rounded-lg">
          {!selectedDeptId
            ? "Selectionnez un departement dans la barre laterale"
            : "Selectionnez un evenement ci-dessus"}
        </div>
      )}
    </div>
  );
}
