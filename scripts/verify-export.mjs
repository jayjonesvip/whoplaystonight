import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { NFL_TEAMS, findNextSlate, getSpotlightGames, getTeamPageData } from "../app/lib/nfl.ts";
import { validateSnapshot } from "./lib/espn.mjs";

const root = join(process.cwd(), "out");
const snapshot = validateSnapshot(JSON.parse(await readFile(join(root, "data/nfl.json"), "utf8")));
const source = JSON.parse(await readFile("public/data/nfl.json", "utf8"));
assert.deepEqual(snapshot, source, "The exported JSON must match the build's snapshot");
const routes = [
  ["index.html", findNextSlate(snapshot)?.games.length ?? 0],
  ...NFL_TEAMS.map(([code]) => [`teams/${code}/index.html`, getTeamPageData(snapshot, code).nextGame ? 1 : 0]),
  ...["monday", "thursday", "sunday", "thanksgiving"].map((kind) => [
    `${kind === "thanksgiving" ? kind : kind + "-night"}-football/index.html`,
    getSpotlightGames(snapshot, kind).games.length,
  ]),
];
for (const [route, count] of routes) {
  const html = await readFile(join(root, route), "utf8");
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
  assert.equal((markup.match(/class="game-card"/g) ?? []).length, count, `${route} must contain its games before JavaScript runs`);
  assert(markup.includes(snapshot.updatedAt), `${route} must display the snapshot timestamp`);
  assert(!/Loading today|Checking the live schedule|Updated hourly/.test(markup), `${route} still has live-feed loading text`);
}
for (const name of await readdir(join(root, "_next/static"), { recursive: true })) {
  if (!name.endsWith(".js")) continue;
  const code = await readFile(join(root, "_next/static", name), "utf8");
  assert(!code.includes("site.api.espn.com"), "ESPN feed code must not ship to browsers");
}
console.log(`Verified ${routes.length} content pages are populated from JSON before JavaScript; no ESPN feed code in browser bundles.`);
