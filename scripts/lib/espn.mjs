import { NFL_TEAMS } from "../../app/lib/nfl.ts";

const knownTeams = new Set(NFL_TEAMS.map(([code]) => code.toUpperCase()));

export function teamView(team, competitor, showScores = false) {
  const abbreviation = team.abbreviation.toUpperCase();
  const score = competitor?.score;
  const scoreText = typeof score === "string" ? score : score?.displayValue ?? (score?.value != null ? String(score.value) : undefined);
  return {
    abbreviation,
    name: team.displayName,
    shortName: team.shortDisplayName ?? team.name ?? team.displayName.split(" ").at(-1),
    logo: team.logo ?? team.logos?.[0]?.href ?? `https://a.espncdn.com/i/teamlogos/nfl/500/${abbreviation.toLowerCase()}.png`,
    record: team.recordSummary ?? competitor?.records?.find((record) => record.type === "total" || record.name === "overall")?.summary,
    ...(showScores && scoreText != null ? { score: scoreText } : {}),
    ...(showScores && competitor?.winner != null ? { winner: competitor.winner } : {}),
  };
}

export function normalizeEvent(event) {
  const competition = event.competitions?.[0];
  const home = competition?.competitors?.find((item) => item.homeAway === "home");
  const away = competition?.competitors?.find((item) => item.homeAway === "away");
  // Future playoff placeholders do not have known NFL teams yet.
  if (!home?.team?.abbreviation || !away?.team?.abbreviation) return null;
  if (!knownTeams.has(home.team.abbreviation.toUpperCase()) || !knownTeams.has(away.team.abbreviation.toUpperCase())) return null;
  if (!event.id || !Number.isFinite(Date.parse(event.date))) throw new Error("Malformed ESPN game");
  const type = competition.status?.type ?? event.status?.type;
  if (!type?.description) throw new Error(`Missing ESPN status for ${event.id}`);
  const completed = type.completed === true || /final/i.test(type.description);
  const state = completed ? "post" : type.state === "in" ? "in" : "pre";
  const names = (competition.broadcasts ?? []).flatMap((broadcast) =>
    broadcast.names ?? (broadcast.media?.shortName ? [broadcast.media.shortName] : []));
  return {
    id: String(event.id),
    date: new Date(event.date).toISOString(),
    status: type.description,
    state,
    completed,
    broadcasts: [...new Set(names)],
    home: teamView(home.team, home, state !== "pre"),
    away: teamView(away.team, away, state !== "pre"),
  };
}

export function validateSnapshot(snapshot) {
  if (snapshot.schemaVersion !== 1 || !Number.isFinite(Date.parse(snapshot.updatedAt))) throw new Error("Invalid snapshot version or timestamp");
  if (!Array.isArray(snapshot.teams) || snapshot.teams.length !== 32) throw new Error("Expected all 32 NFL teams");
  const codes = new Set(snapshot.teams.map((team) => team.abbreviation));
  if (codes.size !== 32 || [...codes].some((code) => !knownTeams.has(code))) throw new Error("Missing or duplicate NFL teams");
  if (!Array.isArray(snapshot.games) || !snapshot.games.length) throw new Error("Refusing to publish an empty NFL schedule");
  const ids = new Set();
  let previous = -Infinity;
  for (const game of snapshot.games) {
    const date = Date.parse(game.date);
    if (!Number.isFinite(date) || date < previous || ids.has(game.id)) throw new Error("Invalid, unsorted, or duplicate game");
    if (!codes.has(game.home.abbreviation) || !codes.has(game.away.abbreviation)) throw new Error("Unknown game participant");
    if (typeof game.completed !== "boolean" || !["pre", "in", "post"].includes(game.state)) throw new Error("Invalid game status");
    if (!Array.isArray(game.broadcasts) || game.broadcasts.some((name) => typeof name !== "string")) throw new Error("Invalid broadcast names");
    ids.add(game.id);
    previous = date;
  }
  return snapshot;
}
