import { getSnapshot } from "@/app/lib/snapshot";
import { getSpotlightGames, type SpotlightKind } from "@/app/lib/nfl";
import { SpotlightView } from "@/app/ui/spotlight-view";

export function SpotlightPage({ kind }: { kind: SpotlightKind }) {
  const snapshot = getSnapshot();
  return <SpotlightView kind={kind} slate={getSpotlightGames(snapshot, kind)} updatedAt={snapshot.updatedAt} />;
}
