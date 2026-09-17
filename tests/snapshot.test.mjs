import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NFL_TEAMS, findNextSlate, getSpotlightGames, getTeamPageData, teamPlaysToday } from "../app/lib/nfl.ts";
import { normalizeEvent, teamView, validateSnapshot } from "../scripts/lib/espn.mjs";
import { collectSnapshot, fetchEspn, writeSnapshot } from "../scripts/refresh-nfl.mjs";

const updatedAt = "2026-09-17T16:00:00Z";
const espnTeam = (code) => ({
  abbreviation: code.toUpperCase(),
  displayName: NFL_TEAMS.find(([abbr]) => abbr === code)[1],
  recordSummary: "1-0",
});
const teams = NFL_TEAMS.map(([code]) => teamView(espnTeam(code)));

function event({ id = "1", date = "2026-09-18T00:15:00Z", state = "pre", broadcasts = [{ names: ["Prime Video"] }] } = {}) {
  return {
    id, date,
    competitions: [{
      status: { type: { description: state === "post" ? "Final" : state === "in" ? "In Progress" : "Scheduled", state, completed: state === "post" } },
      broadcasts,
      competitors: [
        { homeAway: "home", team: espnTeam("buf"), score: { value: 24, displayValue: "24" }, winner: true },
        { homeAway: "away", team: espnTeam("det"), score: "17", winner: false },
      ],
    }],
  };
}

function snapshot(events = [event()], stamp = updatedAt) {
  return {
    schemaVersion: 1, updatedAt: stamp, teams,
    games: events.map(normalizeEvent).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)),
  };
}

test("normalizes scores and both ESPN broadcast formats without exposing scheduled scores", () => {
  const scheduled = normalizeEvent(event());
  assert.equal(scheduled.home.score, undefined);
  assert.equal(scheduled.home.winner, undefined);
  assert.deepEqual(scheduled.broadcasts, ["Prime Video"]);
  const final = normalizeEvent(event({ state: "post", broadcasts: [{ media: { shortName: "CBS" } }] }));
  assert.equal(final.home.score, "24");
  assert.equal(final.away.score, "17");
  assert.equal(final.home.winner, true);
  assert.equal(final.completed, true);
  assert.deepEqual(final.broadcasts, ["CBS"]);
});

test("finds the Eastern slate across midnight, DST, and a season boundary", () => {
  const thursday = findNextSlate(snapshot());
  assert.equal(thursday.date, "20260917");
  assert.equal(thursday.daysAhead, 0);
  assert.equal(findNextSlate(snapshot([], updatedAt)), null);
  assert.equal(findNextSlate(snapshot([event({ date: "2027-01-01T01:15:00Z" })], "2026-12-31T17:00:00Z")).date, "20261231");
  const sunday = findNextSlate(snapshot([event({ date: "2026-11-01T18:00:00Z" })], "2026-11-01T04:00:00Z"));
  assert.equal(sunday.daysAhead, 0);
  assert.equal(sunday.date, "20261101");
});

test("selects final and current games and keeps an in-progress game on the team page", () => {
  const data = snapshot([
    event({ id: "past", date: "2026-09-13T17:00:00Z", state: "post" }),
    event({ id: "current", state: "in" }),
    event({ id: "next", date: "2026-09-27T17:00:00Z" }),
  ], "2026-09-18T01:00:00Z");
  const team = getTeamPageData(data, "BUF");
  assert.equal(team.lastGame.id, "past");
  assert.equal(team.nextGame.id, "current");
  assert.equal(teamPlaysToday(team, data.updatedAt), true);
  assert.equal(getTeamPageData(data, "invalid"), null);
});

test("preserves primetime selection and all three Thanksgiving games", () => {
  const data = snapshot([
    event({ id: "thu" }),
    event({ id: "sun-day", date: "2026-09-20T17:00:00Z" }),
    event({ id: "sun-night", date: "2026-09-21T00:20:00Z" }),
    event({ id: "mon", date: "2026-09-22T00:15:00Z" }),
    event({ id: "thanks-1", date: "2026-11-26T17:30:00Z" }),
    event({ id: "thanks-2", date: "2026-11-26T21:30:00Z" }),
    event({ id: "thanks-3", date: "2026-11-27T01:20:00Z" }),
  ]);
  assert.deepEqual(getSpotlightGames(data, "thursday").games.map((game) => game.id), ["thu"]);
  assert.deepEqual(getSpotlightGames(data, "sunday").games.map((game) => game.id), ["sun-night"]);
  assert.deepEqual(getSpotlightGames(data, "monday").games.map((game) => game.id), ["mon"]);
  assert.equal(getSpotlightGames(data, "thanksgiving").games.length, 3);
});

test("collects all teams, merges duplicate games, and applies updated kickoff details", async () => {
  const requests = [];
  const fetcher = async (url) => {
    requests.push(url);
    const team = /teams\/([^/]+)\/schedule/.exec(url);
    if (team) return Response.json({ team: espnTeam(team[1]), events: team[1] === "buf" ? [event()] : [] });
    const year = new URL(url).searchParams.get("dates");
    return Response.json({ events: year === "2026" ? [event({ date: "2026-09-18T00:30:00Z", broadcasts: [] })] : [] });
  };
  const result = await collectSnapshot({ fetcher, now: new Date(updatedAt) });
  assert.equal(result.teams.length, 32);
  assert.equal(result.games.length, 1);
  assert.equal(result.games[0].date, "2026-09-18T00:30:00.000Z");
  assert.deepEqual(result.games[0].broadcasts, ["Prime Video"]);
  assert.equal(requests.length, 35);
  assert(requests.some((url) => url.includes("dates=2027")));
  assert(requests.some((url) => url.includes("dates=2025")));
});

test("retries temporary upstream failures and rejects malformed responses", async () => {
  let attempts = 0;
  const response = await fetchEspn("scoreboard", async () => ++attempts === 1
    ? new Response("", { status: 503 })
    : Response.json({ events: [] }));
  assert.equal(attempts, 2);
  assert.deepEqual(response.events, []);
  await assert.rejects(fetchEspn("scoreboard", async () => Response.json({ error: "bad feed" })), /missing events/);
});

test("does not publish a partial refresh when any team is unavailable", async () => {
  await assert.rejects(collectSnapshot({
    now: new Date(updatedAt),
    fetcher: async (url) => {
      const code = /teams\/([^/]+)\/schedule/.exec(url)?.[1];
      return Response.json({ team: code === "ari" ? null : espnTeam(code), events: [event()] });
    },
  }), /invalid team for ari/);
});

test("invalid data cannot replace the last valid JSON snapshot", async () => {
  const directory = await mkdtemp(join(tmpdir(), "nfl-snapshot-test-"));
  const target = join(directory, "nfl.json");
  try {
    const good = snapshot();
    await writeSnapshot(good, target);
    await assert.rejects(writeSnapshot({ ...good, teams: good.teams.slice(1) }, target), /32 NFL teams/);
    await assert.rejects(writeSnapshot({ ...good, games: [] }, target), /empty NFL schedule/);
    assert.deepEqual(JSON.parse(await readFile(target, "utf8")), JSON.parse(JSON.stringify(good)));
    assert.throws(() => validateSnapshot({ ...good, games: [...good.games, ...good.games] }), /duplicate/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
