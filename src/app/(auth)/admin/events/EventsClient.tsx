"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import DataTable from "@/components/ui/DataTable";
import BulkActionBar from "@/components/ui/BulkActionBar";

interface EventItem {
  id: string;
  title: string;
  type: string;
  date: string;
  church: { id: string; name: string };
  eventDepts: { department: { id: string; name: string } }[];
}

interface Props {
  initialEvents: EventItem[];
  churches: { id: string; name: string }[];
}

export default function EventsClient({ initialEvents, churches }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [churchId, setChurchId] = useState(churches[0]?.id || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkTitle, setBulkTitle] = useState("");
  const [bulkType, setBulkType] = useState("");
  const [bulkDate, setBulkDate] = useState("");
  const [bulkError, setBulkError] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  function openCreate() {
    setEditing(null);
    setTitle("");
    setType("");
    setDate("");
    setChurchId(churches[0]?.id || "");
    setError("");
    setModalOpen(true);
  }

  function openEdit(ev: EventItem) {
    setEditing(ev);
    setTitle(ev.title);
    setType(ev.type);
    setDate(ev.date.split("T")[0]);
    setChurchId(ev.church.id);
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const url = editing ? `/api/events/${editing.id}` : "/api/events";
      const method = editing ? "PUT" : "POST";
      const body = editing
        ? { title, type, date }
        : { title, type, date, churchId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      const saved = await res.json();

      if (editing) {
        setEvents((prev) =>
          prev.map((ev) => (ev.id === saved.id ? saved : ev))
        );
      } else {
        setEvents((prev) => [saved, ...prev]);
      }

      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(ev: EventItem) {
    if (!confirm(`Supprimer l'evenement "${ev.title}" ?`)) return;

    try {
      const res = await fetch(`/api/events/${ev.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }
      setEvents((prev) => prev.filter((x) => x.id !== ev.id));
    } catch {
      alert("Erreur lors de la suppression");
    }
  }

  async function handleBulkDelete() {
    if (!confirm(`Supprimer ${selectedIds.size} evenement(s) ?`)) return;

    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: "delete" }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }
      setEvents((prev) => prev.filter((ev) => !selectedIds.has(ev.id)));
      setSelectedIds(new Set());
    } catch {
      alert("Erreur lors de la suppression");
    }
  }

  function openBulkEdit() {
    setBulkTitle("");
    setBulkType("");
    setBulkDate("");
    setBulkError("");
    setBulkModalOpen(true);
  }

  async function handleBulkEdit(e: React.FormEvent) {
    e.preventDefault();
    const data: Record<string, string> = {};
    if (bulkTitle) data.title = bulkTitle;
    if (bulkType) data.type = bulkType;
    if (bulkDate) data.date = bulkDate;

    if (Object.keys(data).length === 0) {
      setBulkError("Remplissez au moins un champ");
      return;
    }

    setBulkLoading(true);
    setBulkError("");

    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds), action: "update", data }),
      });

      if (!res.ok) {
        const resp = await res.json();
        throw new Error(resp.error || "Erreur");
      }

      setEvents((prev) =>
        prev.map((ev) => {
          if (!selectedIds.has(ev.id)) return ev;
          const updated = { ...ev };
          if (data.title) updated.title = data.title;
          if (data.type) updated.type = data.type;
          if (data.date) updated.date = new Date(data.date).toISOString();
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

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  return (
    <>
      <div className="mb-4">
        <Button onClick={openCreate}>Nouvel evenement</Button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable
          columns={[
            { header: "Titre", accessor: "title" },
            { header: "Type", accessor: "type" },
            {
              header: "Date",
              accessor: (ev: EventItem) => formatDate(ev.date),
            },
            {
              header: "Eglise",
              accessor: (ev: EventItem) => ev.church.name,
            },
            {
              header: "Departements",
              accessor: (ev: EventItem) =>
                ev.eventDepts.length > 0
                  ? ev.eventDepts.map((ed) => ed.department.name).join(", ")
                  : "-",
            },
          ]}
          data={events}
          emptyMessage="Aucun evenement."
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          actions={(ev) => (
            <div className="flex gap-2 justify-end">
              <Link href={`/events/${ev.id}/star-view`}>
                <Button variant="secondary">STAR</Button>
              </Link>
              <Link href={`/admin/events/${ev.id}`}>
                <Button variant="secondary">Detail</Button>
              </Link>
              <Button variant="secondary" onClick={() => openEdit(ev)}>
                Modifier
              </Button>
              <Button variant="danger" onClick={() => handleDelete(ev)}>
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
        title={editing ? "Modifier l'evenement" : "Nouvel evenement"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label="Type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          />
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          {!editing && (
            <Select
              label="Eglise"
              value={churchId}
              onChange={(e) => setChurchId(e.target.value)}
              options={churches.map((c) => ({ value: c.id, label: c.name }))}
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
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title={`Modifier ${selectedIds.size} evenement(s)`}
      >
        <p className="text-sm text-gray-500 mb-4">
          Seuls les champs remplis seront modifies.
        </p>
        <form onSubmit={handleBulkEdit} className="space-y-4">
          <Input
            label="Titre"
            value={bulkTitle}
            onChange={(e) => setBulkTitle(e.target.value)}
            placeholder="Laisser vide pour ne pas modifier"
          />
          <Input
            label="Type"
            value={bulkType}
            onChange={(e) => setBulkType(e.target.value)}
            placeholder="Laisser vide pour ne pas modifier"
          />
          <Input
            label="Date"
            type="date"
            value={bulkDate}
            onChange={(e) => setBulkDate(e.target.value)}
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
