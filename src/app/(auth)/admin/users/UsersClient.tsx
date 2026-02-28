"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import CheckboxGroup from "@/components/ui/CheckboxGroup";
import Modal from "@/components/ui/Modal";

const ROLES = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "SECRETARY", label: "Secrétaire" },
  { value: "MINISTER", label: "Ministre" },
  { value: "DEPARTMENT_HEAD", label: "Responsable de département" },
];

interface UserRole {
  id: string;
  role: string;
  church: { id: string; name: string };
  ministry: { id: string; name: string } | null;
  departments: { id: string; name: string }[];
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
  ministries: { id: string; name: string; churchId: string }[];
  departments: { id: string; name: string; churchId: string }[];
  canManageRoles: boolean;
  isSuperAdmin: boolean;
}

export default function UsersClient({
  initialUsers,
  churches,
  ministries,
  departments,
  canManageRoles,
  isSuperAdmin,
}: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [newRole, setNewRole] = useState(ROLES[1].value);
  const [newChurchId, setNewChurchId] = useState(churches[0]?.id || "");
  const [newMinistryId, setNewMinistryId] = useState("");
  const [newDepartmentIds, setNewDepartmentIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRole, setEditRole] = useState<UserRole | null>(null);
  const [editUserId, setEditUserId] = useState("");
  const [editMinistryId, setEditMinistryId] = useState("");
  const [editDepartmentIds, setEditDepartmentIds] = useState<string[]>([]);
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const availableRoles = isSuperAdmin
    ? ROLES
    : ROLES.filter((r) => r.value !== "SUPER_ADMIN");

  const filteredMinistries = ministries.filter(
    (m) => m.churchId === newChurchId
  );
  const filteredDepartments = departments.filter(
    (d) => d.churchId === newChurchId
  );

  function openAddRole(user: UserItem) {
    setSelectedUser(user);
    setNewRole(availableRoles[0]?.value || "ADMIN");
    setNewChurchId(churches[0]?.id || "");
    setNewMinistryId("");
    setNewDepartmentIds([]);
    setError("");
    setModalOpen(true);
  }

  function openEditAssignment(userId: string, role: UserRole) {
    setEditUserId(userId);
    setEditRole(role);
    setEditMinistryId(role.ministry?.id || "");
    setEditDepartmentIds(role.departments.map((d) => d.id));
    setEditError("");
    setEditModalOpen(true);
  }

  async function handleAddRole(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    setError("");

    try {
      const payload: Record<string, unknown> = {
        churchId: newChurchId,
        role: newRole,
      };
      if (newRole === "MINISTER" && newMinistryId) {
        payload.ministryId = newMinistryId;
      }
      if (newRole === "DEPARTMENT_HEAD" && newDepartmentIds.length > 0) {
        payload.departmentIds = newDepartmentIds;
      }

      const res = await fetch(`/api/users/${selectedUser.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
                  {
                    id: saved.id,
                    role: saved.role,
                    church: saved.church,
                    ministry: saved.ministry || null,
                    departments: (saved.departments || []).map(
                      (d: { department: { id: string; name: string } }) =>
                        d.department
                    ),
                  },
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

  async function handleEditAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!editRole) return;
    setEditLoading(true);
    setEditError("");

    try {
      const payload: Record<string, unknown> = { roleId: editRole.id };
      if (editRole.role === "MINISTER") {
        payload.ministryId = editMinistryId || null;
      }
      if (editRole.role === "DEPARTMENT_HEAD") {
        payload.departmentIds = editDepartmentIds;
      }

      const res = await fetch(`/api/users/${editUserId}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      const saved = await res.json();

      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUserId
            ? {
                ...u,
                churchRoles: u.churchRoles.map((r) =>
                  r.id === editRole.id
                    ? {
                        ...r,
                        ministry: saved.ministry || null,
                        departments: (saved.departments || []).map(
                          (d: {
                            department: { id: string; name: string };
                          }) => d.department
                        ),
                      }
                    : r
                ),
              }
            : u
        )
      );

      setEditModalOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleRemoveRole(
    userId: string,
    churchId: string,
    role: string
  ) {
    if (!confirm(`Supprimer le rôle ${role} ?`)) return;

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

  function formatRoleBadge(r: UserRole) {
    let label = `${r.role} - ${r.church.name}`;
    if (r.role === "MINISTER" && r.ministry) {
      label += ` (${r.ministry.name})`;
    }
    if (r.role === "DEPARTMENT_HEAD" && r.departments.length > 0) {
      label += ` (${r.departments.map((d) => d.name).join(", ")})`;
    }
    return label;
  }

  const editChurchDepartments = editRole
    ? departments.filter((d) => d.churchId === editRole.church.id)
    : [];
  const editChurchMinistries = editRole
    ? ministries.filter((m) => m.churchId === editRole.church.id)
    : [];

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
                  Ajouter un rôle
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
                    {formatRoleBadge(r)}
                    {canManageRoles &&
                      (r.role === "MINISTER" ||
                        r.role === "DEPARTMENT_HEAD") && (
                        <button
                          onClick={() => openEditAssignment(user.id, r)}
                          className="ml-1 text-gray-500 hover:text-icc-violet"
                          title="Modifier l'affectation"
                        >
                          &#9998;
                        </button>
                      )}
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
              <p className="text-sm text-gray-400">Aucun rôle</p>
            )}
          </div>
        ))}

        {users.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Aucun utilisateur.
          </p>
        )}
      </div>

      {/* Add role modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Ajouter un rôle à ${selectedUser?.name || selectedUser?.email}`}
      >
        <form onSubmit={handleAddRole} className="space-y-4">
          <Select
            label="Rôle"
            value={newRole}
            onChange={(e) => {
              setNewRole(e.target.value);
              setNewMinistryId("");
              setNewDepartmentIds([]);
            }}
            options={availableRoles}
          />
          <Select
            label="Église"
            value={newChurchId}
            onChange={(e) => {
              setNewChurchId(e.target.value);
              setNewMinistryId("");
              setNewDepartmentIds([]);
            }}
            options={churches.map((c) => ({ value: c.id, label: c.name }))}
          />

          {newRole === "MINISTER" && (
            <Select
              label="Ministère"
              value={newMinistryId}
              onChange={(e) => setNewMinistryId(e.target.value)}
              options={filteredMinistries.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
              placeholder="-- Sélectionner un ministère --"
            />
          )}

          {newRole === "DEPARTMENT_HEAD" && (
            <CheckboxGroup
              label="Départements"
              options={filteredDepartments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              selected={newDepartmentIds}
              onChange={setNewDepartmentIds}
            />
          )}

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

      {/* Edit assignment modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Modifier l'affectation"
      >
        <form onSubmit={handleEditAssignment} className="space-y-4">
          {editRole?.role === "MINISTER" && (
            <Select
              label="Ministère"
              value={editMinistryId}
              onChange={(e) => setEditMinistryId(e.target.value)}
              options={editChurchMinistries.map((m) => ({
                value: m.id,
                label: m.name,
              }))}
              placeholder="-- Aucun ministère --"
            />
          )}

          {editRole?.role === "DEPARTMENT_HEAD" && (
            <CheckboxGroup
              label="Départements"
              options={editChurchDepartments.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              selected={editDepartmentIds}
              onChange={setEditDepartmentIds}
            />
          )}

          {editError && <p className="text-sm text-red-600">{editError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setEditModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={editLoading}>
              {editLoading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
