"use client";

import { useRouter } from "next/navigation";

interface Church {
  id: string;
  name: string;
}

interface ChurchSwitcherProps {
  churches: Church[];
  currentChurchId: string;
}

export default function ChurchSwitcher({
  churches,
  currentChurchId,
}: ChurchSwitcherProps) {
  const router = useRouter();

  if (churches.length <= 1) return null;

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const churchId = e.target.value;
    await fetch("/api/current-church", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ churchId }),
    });
    router.refresh();
  }

  return (
    <select
      value={currentChurchId}
      onChange={handleChange}
      className="bg-white/10 text-white text-sm border border-white/30 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-white/50"
    >
      {churches.map((c) => (
        <option key={c.id} value={c.id} className="text-gray-900">
          {c.name}
        </option>
      ))}
    </select>
  );
}
