import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import { SpotlightPage } from "@/app/ui/spotlight-page";
export const metadata: Metadata = pageMetadata({
  title: "Who Plays Monday Night Football Tonight?",
  description: "Find who plays Monday Night Football tonight, what time the game starts, and the TV channel or streaming service carrying it.",
  path: "/monday-night-football",
  keywords: ["who plays Monday Night Football tonight", "what time is Monday Night Football", "Monday Night Football channel", "MNF tonight"],
});
export default function Page() { return <SpotlightPage kind="monday" />; }
