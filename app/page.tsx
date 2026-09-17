import { HomeLive } from "@/app/ui/home-live";
import { findNextSlate } from "@/app/lib/nfl";
import { getSnapshot } from "@/app/lib/snapshot";

export default function Home() {
  const snapshot = getSnapshot();
  return <HomeLive slate={findNextSlate(snapshot)} updatedAt={snapshot.updatedAt} />;
}
