import { mkdir, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { NFL_TEAMS } from "../app/lib/nfl.ts";
import { normalizeEvent, teamView, validateSnapshot } from "./lib/espn.mjs";

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const output = fileURLToPath(new URL("../public/data/nfl.json", import.meta.url));

export async function fetchEspn(route, fetcher = fetch) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetcher(`${ESPN_BASE}/${route}`, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`ESPN ${route}: HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.events)) throw new Error(`ESPN ${route}: missing events array`);
      return data;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await delay(500 * (attempt + 1));
    }
  }
  throw lastError;
}

export async function collectSnapshot({ fetcher = fetch, now = new Date() } = {}) {
  const year = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", year: "numeric" }).format(now));
  const teamSchedules = [];
  // Limit parallel ESPN requests while still fetching the full league quickly.
  for (let index = 0; index < NFL_TEAMS.length; index += 4) {
    const group = NFL_TEAMS.slice(index, index + 4);
    teamSchedules.push(...await Promise.all(group.map(async ([code]) => {
      const data = await fetchEspn(`teams/${code}/schedule`, fetcher);
      if (data.team?.abbreviation?.toLowerCase() !== code || !data.team?.displayName) {
        throw new Error(`ESPN returned an invalid team for ${code}`);
      }
      return data;
    })));
  }
  // Calendar years include January playoffs and the next season's posted games.
  const scoreboards = await Promise.all([year - 1, year, year + 1].map((value) =>
    fetchEspn(`scoreboard?dates=${value}&limit=1000`, fetcher)));
  const games = new Map();
  for (const data of [...teamSchedules, ...scoreboards]) {
    for (const event of data.events) {
      const game = normalizeEvent(event);
      if (!game) continue;
      const previous = games.get(game.id);
      if (previous && game.broadcasts.length === 0) game.broadcasts = previous.broadcasts;
      games.set(game.id, game);
    }
  }
  return validateSnapshot({
    schemaVersion: 1,
    updatedAt: now.toISOString(),
    teams: teamSchedules.map((data) => teamView(data.team)),
    games: [...games.values()].sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
  });
}

export async function writeSnapshot(snapshot, target = output) {
  validateSnapshot(snapshot);
  await mkdir(dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}`;
  try {
    await writeFile(temporary, JSON.stringify(snapshot) + "\n", "utf8");
    await rename(temporary, target);
  } finally {
    await rm(temporary, { force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const snapshot = await collectSnapshot();
  await writeSnapshot(snapshot);
  console.log(`Saved ${snapshot.games.length} games and ${snapshot.teams.length} teams to public/data/nfl.json (${snapshot.updatedAt})`);
}
