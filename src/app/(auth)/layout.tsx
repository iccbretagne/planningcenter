import pkg from "@/../package.json";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import Sidebar from "@/components/Sidebar";

const adminLinks = [
  { href: "/admin/churches", label: "Églises", permission: "church:manage" },
  { href: "/admin/users", label: "Utilisateurs", permission: "members:manage" },
  { href: "/admin/ministries", label: "Ministères", permission: "departments:manage" },
  { href: "/admin/departments", label: "Départements", permission: "departments:manage" },
  { href: "/admin/members", label: "Membres", permission: "members:manage" },
  { href: "/admin/events", label: "Événements", permission: "events:manage" },
];

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const churchRoles = session.user.churchRoles;
  const currentChurchId = churchRoles[0]?.churchId;
  const churchName = churchRoles[0]?.church?.name || "Église";

  // Get departments the user has access to
  const userDepartmentIds = churchRoles
    .filter((r) => !currentChurchId || r.churchId === currentChurchId)
    .flatMap((r) => r.departments.map((d) => d.department));

  const departments = Array.from(
    new Map(userDepartmentIds.map((d) => [d.id, d])).values()
  );

  // For super admins / admins, show all departments
  const isAdmin = churchRoles.some(
    (r) =>
      r.churchId === currentChurchId &&
      (r.role === "SUPER_ADMIN" || r.role === "ADMIN" || r.role === "SECRETARY")
  );

  let allDepartments = departments;
  if (isAdmin && currentChurchId) {
    const depts = await prisma.department.findMany({
      where: { ministry: { churchId: currentChurchId } },
      include: { ministry: true },
      orderBy: [{ ministry: { name: "asc" } }, { name: "asc" }],
    });
    allDepartments = depts.map((d) => ({ id: d.id, name: d.name }));
  }

  // Compute visible admin links
  const userRoles = churchRoles.map((r) => r.role);
  const userPermissions = new Set(userRoles.flatMap((r) => hasPermission(r)));
  const visibleAdminLinks = adminLinks
    .filter((link) => userPermissions.has(link.permission))
    .map(({ href, label }) => ({ href, label }));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-icc-violet border-b-2 border-icc-violet-dark">
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          <div>
            <h1 className="text-xl font-bold text-white">PlanningCenter</h1>
            <p className="text-sm text-white/70">{churchName}</p>
          </div>
          <div className="flex items-center gap-4">
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name || ""}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-white">{session.user.name}</span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="px-3 py-1 text-sm text-white/80 border border-white/30 rounded-md hover:bg-white/10 transition-colors"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="flex mx-auto max-w-7xl">
        <Sidebar
          departments={allDepartments}
          adminLinks={visibleAdminLinks}
        />

        <main className="flex-1 p-6">{children}</main>
      </div>

      <footer className="py-4 text-center text-xs text-gray-400">
        <a
          href="https://github.com/iccbretagne/planningcenter"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-gray-600 transition-colors"
        >
          PlanningCenter
        </a>{" "}
        <span>v{pkg.version}</span>
      </footer>
    </div>
  );
}
