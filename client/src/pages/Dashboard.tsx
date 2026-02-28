import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import EventSelector from "../components/EventSelector";
import PlanningGrid from "../components/PlanningGrid";

export default function Dashboard() {
  const { user, logout, currentChurchId } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);

  if (!user || !currentChurchId) {
    return <div className="p-4">Chargement...</div>;
  }

  // Gather departments the user is responsible for
  const userDepartments = user.churchRoles
    .filter((r) => r.churchId === currentChurchId)
    .flatMap((r) => r.departments.map((d) => d.department));

  // Deduplicate
  const departments = Array.from(
    new Map(userDepartments.map((d) => [d.id, d])).values()
  );

  const churchName =
    user.churchRoles.find((r) => r.churchId === currentChurchId)?.church
      .name || "Eglise";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              PlanningCenter
            </h1>
            <p className="text-sm text-gray-500">{churchName}</p>
          </div>
          <div className="flex items-center gap-4">
            {user.avatarUrl && (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-700">{user.name}</span>
            <button
              onClick={logout}
              className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Deconnexion
            </button>
          </div>
        </div>
      </header>

      <div className="flex mx-auto max-w-7xl">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-73px)] bg-white border-r border-gray-200 p-4">
          <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase">
            Departements
          </h2>
          {departments.length === 0 ? (
            <p className="text-sm text-gray-400">
              Aucun departement assigne.
            </p>
          ) : (
            <nav className="space-y-1">
              {departments.map((dept) => (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDepartmentId(dept.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedDepartmentId === dept.id
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {dept.name}
                </button>
              ))}
            </nav>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="mb-6">
            <EventSelector
              churchId={currentChurchId}
              selectedEventId={selectedEventId}
              onSelect={setSelectedEventId}
            />
          </div>

          {selectedEventId && selectedDepartmentId ? (
            <PlanningGrid
              eventId={selectedEventId}
              departmentId={selectedDepartmentId}
            />
          ) : (
            <div className="p-8 text-center text-gray-400 border-2 border-gray-200 border-dashed rounded-lg">
              {!selectedDepartmentId
                ? "Selectionnez un departement dans la barre laterale"
                : "Selectionnez un evenement ci-dessus"}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
