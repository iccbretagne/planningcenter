"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "SECRETARY", label: "Secretaire" },
  { value: "MINISTER", label: "Ministre" },
  { value: "DEPARTMENT_HEAD", label: "Chef de departement" },
];

interface UserRole {
  id: string;
  role: string;
  church: { id: string; name: string };
}

interface UserItem {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  churchRoles: UserRole[];
}

interface Props {
  initialUsers: UserItem[];
  churches: { id: string; name: string }[];
  canManageRoles: boolean;
  isSuperAdmin: boolean;
}

export default function UsersClient({
  initialUsers,
  churches,
  canManageRoles,
  isSuperAdmin,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState(ROLES[1].value);
  const [newChurchId, setNewChurchId] = useState(churches[0]?.id || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const availableRoles = isSuperAdmin
    ? ROLES
    : ROLES.filter((r) => r.value !== "SUPER_ADMIN");

  function openAddRole(user: UserItem) {
    setSelectedUser(user);
    setNewRole(availableRoles[0]?.value || "ADMIN");
    setNewChurchId(churches[0]?.id || "");
    setError("");
    setModalOpen(true);
  }

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/users/${selectedUser.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchId: newChurchId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      const saved = await res.json();

      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id
            ? {
                ...u,
                churchRoles: [
                  ...u.churchRoles,
                  { id: saved.id, role: saved.role, church: saved.church },
                ],
              }
            : u
        )
      );

      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveRole(
    userId: string,
    churchId: string,
    role: string
  ) {
    if (!confirm(`Supprimer le role ${role} ?`)) return;

    try {
      const res = await fetch(`/api/users/${userId}/roles`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ churchId, role }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur");
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                churchRoles: u.churchRoles.filter(
                  (r) => !(r.church.id === churchId && r.role === role)
                ),
              }
            : u
        )
      );
    } catch {
      alert("Erreur");
    }
  }

  return (
    <>
      <div className="space-y-4">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                {user.image && (
                  <img
                    src={user.image}
                    alt=""
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium text-gray-900">
                    {user.name || "Sans nom"}
                  </p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              {canManageRoles && (
                <Button variant="secondary" onClick={() => openAddRole(user)}>
                  Ajouter un role
                </Button>
              )}
            </div>

            {user.churchRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {user.churchRoles.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-700"
                  >
                    {r.role} - {r.church.name}
                    {canManageRoles && (
                      <button
                        onClick={() =>
                          handleRemoveRole(user.id, r.church.id, r.role)
                        }
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        &times;
                      </button>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Aucun role</p>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Aucun utilisateur.
          </p>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Ajouter un role a ${selectedUser?.name || selectedUser?.email}`}
      >
        <form onSubmit={handleAddRole} className="space-y-4">
          <Select
            label="Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            options={availableRoles}
          />
          <Select
            label="Eglise"
            value={newChurchId}
            onChange={(e) => setNewChurchId(e.target.value)}
            options={churches.map((c) => ({ value: c.id, label: c.name }))}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
