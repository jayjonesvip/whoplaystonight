import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import { SpotlightPage } from "@/app/ui/spotlight-page";
export const metadata: Metadata = pageMetadata({
  title: "Who Plays Sunday Night Football Tonight?",
  description: "Find who plays Sunday Night Football tonight, what time the game starts, and how to watch on NBC or Peacock.",
  path: "/sunday-night-football",
  keywords: ["who plays Sunday Night Football tonight", "what time is Sunday Night Football", "Sunday Night Football channel", "SNF tonight"],
});
export default function Page() { return <SpotlightPage kind="sunday" />; }
