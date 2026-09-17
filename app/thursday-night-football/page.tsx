import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import { SpotlightPage } from "@/app/ui/spotlight-page";
export const metadata: Metadata = pageMetadata({
  title: "Who Plays Thursday Night Football Tonight?",
  description: "Find who plays Thursday Night Football tonight, what time the game starts, and how to stream it on Prime Video.",
  path: "/thursday-night-football",
  keywords: ["who plays Thursday Night Football tonight", "what time is Thursday Night Football", "Thursday Night Football streaming", "TNF tonight"],
});
export default function Page() { return <SpotlightPage kind="thursday" />; }
