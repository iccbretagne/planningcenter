import { useState, useEffect } from "react";
import api from "../lib/api";

interface Event {
  id: number;
  title: string;
  type: string;
  date: string;
}

interface EventSelectorProps {
  churchId: number;
  selectedEventId: number | null;
  onSelect: (eventId: number) => void;
}

export default function EventSelector({
  churchId,
  selectedEventId,
  onSelect,
}: EventSelectorProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/churches/${churchId}/events`)
      .then(({ data }) => {
        setEvents(data);
        // Auto-select the next upcoming event
        if (data.length > 0 && !selectedEventId) {
          const now = new Date();
          const upcoming = data.find(
            (e: Event) => new Date(e.date) >= now
          );
          onSelect((upcoming || data[0]).id);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [churchId, selectedEventId, onSelect]);

  if (loading) return <div className="text-sm text-gray-500">Chargement des events...</div>;

  return (
    <div>
      <label className="block mb-1 text-sm font-medium text-gray-700">
        Evenement
      </label>
      <select
        value={selectedEventId || ""}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="" disabled>
          Choisir un evenement
        </option>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.title} ({new Date(event.date).toLocaleDateString("fr-FR")})
          </option>
        ))}
      </select>
    </div>
  );
}
