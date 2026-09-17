import type { Metadata } from "next";
import { pageMetadata } from "@/app/lib/seo";
import { SpotlightPage } from "@/app/ui/spotlight-page";
export const metadata: Metadata = pageMetadata({
  title: "Who Plays Football on Thanksgiving?",
  description: "See every NFL game on Thanksgiving, including matchups, kickoff times, TV channels, and streaming options.",
  path: "/thanksgiving-football",
  keywords: ["who plays on Thanksgiving", "Thanksgiving football schedule", "NFL Thanksgiving games", "Thanksgiving NFL game times and channels"],
});
export default function Page() { return <SpotlightPage kind="thanksgiving" />; }
