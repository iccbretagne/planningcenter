"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";

interface Department {
  id: string;
  name: string;
  ministryName: string;
  linked: boolean;
}

interface Props {
  eventId: string;
  departments: Department[];
}

export default function EventDetailClient({ eventId, departments }: Props) {
  const [depts, setDepts] = useState(departments);
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleDepartment(dept: Department) {
    setLoading(dept.id);

    try {
      const method = dept.linked ? "DELETE" : "POST";
      const res = await fetch(`/api/events/${eventId}/departments`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departmentId: dept.id }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur");
        return;
      }

      setDepts((prev) =>
        prev.map((d) =>
          d.id === dept.id ? { ...d, linked: !d.linked } : d
        )
      );
    } catch {
      alert("Erreur");
    } finally {
      setLoading(null);
    }
  }

  const grouped = depts.reduce(
    (acc, d) => {
      if (!acc[d.ministryName]) acc[d.ministryName] = [];
      acc[d.ministryName].push(d);
      return acc;
    },
    {} as Record<string, Department[]>
  );

  return (
    <div>
      <div className="mb-4 flex gap-3">
        <Link href="/admin/events">
          <Button variant="secondary">&larr; Retour aux evenements</Button>
        </Link>
        <Link href={`/events/${eventId}/star-view`}>
          <Button>Voir STAR en service</Button>
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Departements associes
      </h2>

      <div className="space-y-6">
        {Object.entries(grouped).map(([ministry, deps]) => (
          <div key={ministry} className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              {ministry}
            </h3>
            <div className="space-y-2">
              {deps.map((d) => (
                <label
                  key={d.id}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={d.linked}
                    onChange={() => toggleDepartment(d)}
                    disabled={loading === d.id}
                    className="h-4 w-4 rounded border-gray-300 text-icc-violet focus:ring-icc-violet"
                  />
                  <span className="text-sm text-gray-700">
                    {d.name}
                    {loading === d.id && (
                      <span className="ml-2 text-gray-400">...</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
