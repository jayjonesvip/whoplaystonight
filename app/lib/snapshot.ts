import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NflSnapshot } from "@/app/lib/nfl";

// Used only by server page components during static export.
export function getSnapshot(): NflSnapshot {
  const snapshot = JSON.parse(readFileSync(join(process.cwd(), "public/data/nfl.json"), "utf8")) as NflSnapshot;
  if (snapshot.schemaVersion !== 1 || !snapshot.updatedAt || snapshot.teams.length !== 32) {
    throw new Error("Missing or invalid NFL snapshot. Run pnpm data:refresh before building.");
  }
  return snapshot;
}
