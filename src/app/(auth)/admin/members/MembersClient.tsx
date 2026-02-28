"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import BulkActionBar from "@/components/ui/BulkActionBar";

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  department: {
    id: string;
    name: string;
    ministry: { id: string; name: string };
  };
}

interface Props {
  initialMembers: Member[];
  departments: { id: string; name: string; ministryName: string }[];
}

export default function MembersClient({ initialMembers, departments }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [departmentId, setDepartmentId] = useState(departments[0]?.id || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filterDept, setFilterDept] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFirstName, setBulkFirstName] = useState("");
  const [bulkLastName, setBulkLastName] = useState("");
  const [bulkDepartmentId, setBulkDepartmentId] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  function openCreate() {
    setEditing(null);
    setFirstName("");
    setLastName("");
    setDepartmentId(departments[0]?.id || "");
    setError("");
    setModalOpen(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    setFirstName(m.firstName);
    setLastName(m.lastName);
    setDepartmentId(m.department.id);
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = editing ? `/api/members/${editing.id}` : "/api/members";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, departmentId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      const saved = await res.json();

      if (editing) {
        setMembers((prev) => prev.map((m) => (m.id === saved.id ? saved : m)));
      } else {
        setMembers((prev) => [...prev, saved]);
      }

      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(m: Member) {
    if (!confirm(`Supprimer ${m.firstName} ${m.lastName} ?`)) return;

    try {
      const res = await fetch(`/api/members/${m.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
    } catch {
      alert("Erreur lors de la suppression");
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Supprimer ${selectedIds.size} membre(s) ?`)) return;

    try {
      const res = await fetch("/api/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: "delete" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }
      setMembers((prev) => prev.filter((m) => !selectedIds.has(m.id)));
      setSelectedIds(new Set());
    } catch {
      alert("Erreur lors de la suppression");
    }
  }

  function openBulkEdit() {
    setBulkFirstName("");
    setBulkLastName("");
    setBulkDepartmentId("");
    setBulkError("");
    setBulkModalOpen(true);
  }

  async function handleBulkEdit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, string> = {};
    if (bulkFirstName) data.firstName = bulkFirstName;
    if (bulkLastName) data.lastName = bulkLastName;
    if (bulkDepartmentId) data.departmentId = bulkDepartmentId;

    if (Object.keys(data).length === 0) {
      setBulkError("Remplissez au moins un champ");
      return;
    }

    setBulkLoading(true);
    setBulkError("");

    try {
      const res = await fetch("/api/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: "update", data }),
      });

      if (!res.ok) {
        const resp = await res.json();
        throw new Error(resp.error || "Erreur");
      }

      setMembers((prev) =>
        prev.map((m) => {
          if (!selectedIds.has(m.id)) return m;
          const updated = { ...m, ...data };
          if (data.departmentId) {
            const dept = departments.find((d) => d.id === data.departmentId);
            if (dept) {
              updated.department = {
                id: dept.id,
                name: dept.name,
                ministry: m.department.ministry,
              };
            }
          }
          return updated;
        })
      );
      setSelectedIds(new Set());
      setBulkModalOpen(false);
    } catch (err) {
      setBulkError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBulkLoading(false);
    }
  }

  const filtered = filterDept
    ? members.filter((m) => m.department.id === filterDept)
    : members;

  return (
    <>
      <div className="mb-4 flex items-center gap-4">
        <Button onClick={openCreate}>Nouveau membre</Button>
        <div className="w-64">
          <Select
            label=""
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            placeholder="Tous les départements"
            options={departments.map((d) => ({
              value: d.id,
              label: `${d.name} (${d.ministryName})`,
            }))}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={[
            { header: "Nom", accessor: "lastName" },
            { header: "Prénom", accessor: "firstName" },
            {
              header: "Département",
              accessor: (m: Member) => m.department.name,
            },
            {
              header: "Ministère",
              accessor: (m: Member) => m.department.ministry.name,
            },
          ]}
          data={filtered}
          emptyMessage="Aucun membre."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          actions={(m) => (
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => openEdit(m)}>
                Modifier
              </Button>
              <Button variant="danger" onClick={() => handleDelete(m)}>
                Supprimer
              </Button>
            </div>
          )}
        />
      </div>

      <BulkActionBar
        count={selectedIds.size}
        onEdit={openBulkEdit}
        onDelete={handleBulkDelete}
        onClear={() => setSelectedIds(new Set())}
      />

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Modifier le membre" : "Nouveau membre"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
          <Input
            label="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
          <Select
            label="Département"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            options={departments.map((d) => ({
              value: d.id,
              label: `${d.name} (${d.ministryName})`,
            }))}
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
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title={`Modifier ${selectedIds.size} membre(s)`}
      >
        <p className="text-sm text-gray-500 mb-4">
          Seuls les champs remplis seront modifiés.
        </p>
        <form onSubmit={handleBulkEdit} className="space-y-4">
          <Input
            label="Prénom"
            value={bulkFirstName}
            onChange={(e) => setBulkFirstName(e.target.value)}
            placeholder="Laisser vide pour ne pas modifier"
          />
          <Input
            label="Nom"
            value={bulkLastName}
            onChange={(e) => setBulkLastName(e.target.value)}
            placeholder="Laisser vide pour ne pas modifier"
          />
          <Select
            label="Département"
            value={bulkDepartmentId}
            onChange={(e) => setBulkDepartmentId(e.target.value)}
            placeholder="Ne pas modifier"
            options={departments.map((d) => ({
              value: d.id,
              label: `${d.name} (${d.ministryName})`,
            }))}
          />
          {bulkError && <p className="text-sm text-red-600">{bulkError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setBulkModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={bulkLoading}>
              {bulkLoading ? "Enregistrement..." : "Appliquer"}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
