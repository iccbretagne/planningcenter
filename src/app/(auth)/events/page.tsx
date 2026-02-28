import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EventsPageClient from "./EventsPageClient";

export default async function EventsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  const currentChurchId = session.user.churchRoles[0]?.churchId;

  if (!currentChurchId) {
    return (
      <div className="p-8 text-center text-gray-400 border-2 border-gray-200 border-dashed rounded-lg">
        Vous n&apos;êtes assigné à aucune église.
      </div>
    );
  }

  return <EventsPageClient churchId={currentChurchId} />;
}
