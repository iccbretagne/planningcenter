"use client";

import { useState, useEffect, useCallback } from "react";

interface MemberItem {
  id: string;
  firstName: string;
  lastName: string;
  status: "EN_SERVICE" | "EN_SERVICE_DEBRIEF";
}

interface EventItem {
  id: string;
  title: string;
  date: string;
  members: MemberItem[];
}

interface Props {
  departmentId: string;
}

export default function MonthlyPlanningView({ departmentId }: Props) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/departments/${departmentId}/monthly-planning?month=${currentMonth}`
      );
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [departmentId, currentMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function navigateMonth(delta: number) {
    const [y, m] = currentMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setCurrentMonth(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }

  function formatMonthLabel(ym: string) {
    const [y, m] = ym.split("-").map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  }

  function formatEventDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          &larr;
        </button>
        <h2 className="text-lg font-semibold text-gray-900 capitalize">
          {formatMonthLabel(currentMonth)}
        </h2>
        <button
          onClick={() => navigateMonth(1)}
          className="px-3 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-700"
        >
          &rarr;
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Chargement...</div>
      ) : events.length === 0 ? (
        <div className="p-8 text-center text-gray-400 border-2 border-gray-200 border-dashed rounded-lg">
          Aucun evenement ce mois
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow p-4"
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-sm font-medium text-icc-violet capitalize">
                  {formatEventDate(event.date)}
                </span>
                <span className="text-sm text-gray-500">{event.title}</span>
              </div>
              {event.members.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                  (aucun STAR en service)
                </p>
              ) : (
                <ul className="space-y-1">
                  {event.members.map((member) => (
                    <li key={member.id} className="text-sm text-gray-700">
                      {member.status === "EN_SERVICE_DEBRIEF" && (
                        <svg className="inline-block w-4 h-4 mr-1 text-icc-violet align-text-bottom" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" title="Debrief">
                          <path d="M12 2C6.48 2 2 5.58 2 10c0 2.24 1.12 4.27 2.94 5.72L3 22l5.34-2.56C9.5 19.8 10.72 20 12 20c5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                        </svg>
                      )}
                      {member.firstName} {member.lastName}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
