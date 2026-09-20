import type { Metadata } from "next";
import { EventsContent } from "./EventsContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Events & Experiences",
  description: dictionaries.de.pages.events.metaDescription,
};

export default function EventsPage() {
  return <EventsContent />;
}
