"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface Props {
  church: { id: string; name: string; slug: string };
}

export default function ChurchEditClient({ church }: Props) {
  const router = useRouter();
  const [name, setName] = useState(church.name);
  const [slug, setSlug] = useState(church.slug);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/churches/${church.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }

      setSuccess(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && (
          <p className="text-sm text-green-600">Eglise mise a jour.</p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => router.push("/admin/churches")}
          >
            Retour
          </Button>
        </div>
      </form>
    </div>
  );
}
