const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const EASTERN = "America/New_York";
const RESPONSE_TTL_MS = 60 * 60 * 1000;
const responseCache = new Map<string, { expires: number; data: unknown }>();

export const NFL_TEAMS = [
  ["ari", "Arizona Cardinals"], ["atl", "Atlanta Falcons"], ["bal", "Baltimore Ravens"],
  ["buf", "Buffalo Bills"], ["car", "Carolina Panthers"], ["chi", "Chicago Bears"],
  ["cin", "Cincinnati Bengals"], ["cle", "Cleveland Browns"], ["dal", "Dallas Cowboys"],
  ["den", "Denver Broncos"], ["det", "Detroit Lions"], ["gb", "Green Bay Packers"],
  ["hou", "Houston Texans"], ["ind", "Indianapolis Colts"], ["jax", "Jacksonville Jaguars"],
  ["kc", "Kansas City Chiefs"], ["lv", "Las Vegas Raiders"], ["lac", "Los Angeles Chargers"],
  ["lar", "Los Angeles Rams"], ["mia", "Miami Dolphins"], ["min", "Minnesota Vikings"],
  ["ne", "New England Patriots"], ["no", "New Orleans Saints"], ["nyg", "New York Giants"],
  ["nyj", "New York Jets"], ["phi", "Philadelphia Eagles"], ["pit", "Pittsburgh Steelers"],
  ["sf", "San Francisco 49ers"], ["sea", "Seattle Seahawks"], ["tb", "Tampa Bay Buccaneers"],
  ["ten", "Tennessee Titans"], ["wsh", "Washington Commanders"],
] as const;

type EspnTeam = {
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo?: string;
  logos?: Array<{ href: string }>;
};

type EspnCompetitor = {
  homeAway: "home" | "away";
  winner?: boolean;
  score?: string | { displayValue?: string; value?: number };
  records?: Array<{ name?: string; type?: string; summary?: string }>;
  team: EspnTeam;
};

type EspnCompetition = {
  competitors: EspnCompetitor[];
  broadcasts?: Array<{ names?: string[] }>;
  status?: { type?: { name?: string; description?: string; detail?: string; completed?: boolean } };
};

type EspnEvent = {
  id: string;
  date: string;
  competitions: EspnCompetition[];
  status?: { type?: { name?: string; description?: string; detail?: string; completed?: boolean } };
};

type ScoreboardResponse = { events?: EspnEvent[] };
type TeamScheduleResponse = { team?: EspnTeam; events?: EspnEvent[] };

export type TeamView = {
  abbreviation: string;
  name: string;
  shortName: string;
  logo: string;
  record?: string;
};

export type GameView = {
  id: string;
  date: string;
  status: string;
  broadcasts: string[];
  away: TeamView & { score?: string; winner?: boolean };
  home: TeamView & { score?: string; winner?: boolean };
};

export type TeamPageData = {
  team: TeamView;
  nextGame: GameView | null;
  lastGame: GameView | null;
};

export type SpotlightKind = "monday" | "sunday" | "thursday" | "thanksgiving";

const SPOTLIGHT_COPY: Record<SpotlightKind, { title: string; shortTitle: string; description: string }> = {
  monday: {
    title: "Who plays Monday Night Football tonight?",
    shortTitle: "Monday Night Football",
    description: "See who plays Monday Night Football tonight, what time it starts, and the TV channel or streaming service.",
  },
  sunday: {
    title: "Who plays Sunday Night Football tonight?",
    shortTitle: "Sunday Night Football",
    description: "See who plays Sunday Night Football tonight, what time it starts, and how to watch on NBC or Peacock.",
  },
  thursday: {
    title: "Who plays Thursday Night Football tonight?",
    shortTitle: "Thursday Night Football",
    description: "See who plays Thursday Night Football tonight, what time it starts, and how to stream it on Prime Video.",
  },
  thanksgiving: {
    title: "Who plays football on Thanksgiving?",
    shortTitle: "Thanksgiving Football",
    description: "Every NFL game on Thanksgiving, with kickoff times, TV channels, and streaming options.",
  },
};

export function getSpotlightCopy(kind: SpotlightKind) {
  return SPOTLIGHT_COPY[kind];
}

const FALLBACK_LOGO = "/favicon.svg";

function scoreValue(score: EspnCompetitor["score"]): string | undefined {
  if (typeof score === "string") return score;
  return score?.displayValue ?? (score?.value != null ? String(score.value) : undefined);
}

function teamView(team: EspnTeam, competitor?: EspnCompetitor, showScore = true): GameView["home"] {
  const overallRecord = competitor?.records?.find((record) =>
    record.type === "total" || record.name === "overall"
  )?.summary ?? competitor?.records?.[0]?.summary;
  return {
    abbreviation: team.abbreviation,
    name: team.displayName,
    shortName: team.shortDisplayName ?? team.displayName.split(" ").slice(-1)[0],
    logo: team.logo ?? team.logos?.[0]?.href ?? FALLBACK_LOGO,
    record: overallRecord,
    score: competitor && showScore ? scoreValue(competitor.score) : undefined,
    winner: showScore ? competitor?.winner : undefined,
  };
}

function normalizeEvent(event: EspnEvent): GameView | null {
  const competition = event.competitions?.[0];
  const home = competition?.competitors?.find((c) => c.homeAway === "home");
  const away = competition?.competitors?.find((c) => c.homeAway === "away");
  if (!competition || !home || !away) return null;
  const type = competition.status?.type ?? event.status?.type;
  const status = type?.description ?? "Scheduled";
  const showScores = !/scheduled|pre/i.test(status);
  return {
    id: event.id,
    date: event.date,
    status,
    broadcasts: [...new Set(competition.broadcasts?.flatMap((b) => b.names ?? []) ?? [])],
    away: teamView(away.team, away, showScores),
    home: teamView(home.team, home, showScores),
  };
}

async function fetchJson<T>(url: string): Promise<T> {
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage.getItem(`who-plays-tonight:${url}`);
      if (stored) {
        const cached = JSON.parse(stored) as { expires: number; data: T };
        if (cached.expires > Date.now()) return cached.data;
        window.localStorage.removeItem(`who-plays-tonight:${url}`);
      }
    } catch {
      // Storage can be unavailable in private browsing; the live request still works.
    }
  }

  const cached = responseCache.get(url);
  if (cached && cached.expires > Date.now()) return cached.data as T;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Schedule request failed: ${response.status}`);
  const data = await response.json() as T;
  responseCache.set(url, { expires: Date.now() + RESPONSE_TTL_MS, data });
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(`who-plays-tonight:${url}`, JSON.stringify({
        expires: Date.now() + RESPONSE_TTL_MS,
        data,
      }));
    } catch {
      // The in-memory cache remains available.
    }
  }
  return data;
}

function easternDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

function easternDateKey(date: Date) {
  const parts = easternDateParts(date);
  return `${parts.year}${parts.month}${parts.day}`;
}

function easternWeekdayAndHour(date: string) {
  const value = new Date(date);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: EASTERN, weekday: "long" }).format(value);
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN, hour: "numeric", hour12: false,
  }).format(value));
  return { weekday, hour };
}

function thanksgivingDateKey(year: number) {
  const first = new Date(Date.UTC(year, 10, 1, 12));
  const firstDay = first.getUTCDay();
  const firstThursday = 1 + ((4 - firstDay + 7) % 7);
  const day = firstThursday + 21;
  return `${year}11${String(day).padStart(2, "0")}`;
}

function addDaysEastern(days: number) {
  const { year, month, day } = easternDateParts();
  const noonUtc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + days, 12));
  const parts = easternDateParts(noonUtc);
  return `${parts.year}${parts.month}${parts.day}`;
}

function parseEspnDate(date: string) {
  return new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T12:00:00Z`);
}

export async function findNextSlate() {
  try {
    for (let daysAhead = 0; daysAhead <= 8; daysAhead += 1) {
      const date = addDaysEastern(daysAhead);
      const data = await fetchJson<ScoreboardResponse>(`${ESPN_BASE}/scoreboard?dates=${date}`);
      const games = (data.events ?? []).map(normalizeEvent).filter((game): game is GameView => Boolean(game));
      if (games.length) return { date, daysAhead, games };
    }
  } catch (error) {
    console.error("Unable to load NFL slate:", error instanceof Error ? `${error.name}: ${error.message}` : String(error));
    if (typeof window !== "undefined") throw error;
  }
  return null;
}

export function getAllTeams(games: GameView[] = []): TeamView[] {
  const found = new Map<string, TeamView>();
  for (const game of games) {
    found.set(game.away.abbreviation, game.away);
    found.set(game.home.abbreviation, game.home);
  }
  return NFL_TEAMS.map(([abbreviation, name]) => {
    const live = found.get(abbreviation.toUpperCase());
    return live ?? {
      abbreviation: abbreviation.toUpperCase(),
      name,
      shortName: name.split(" ").slice(-1)[0],
      logo: `https://a.espncdn.com/i/teamlogos/nfl/500/${abbreviation}.png`,
    };
  });
}

export async function getTeamPageData(code: string): Promise<TeamPageData | null> {
  const normalized = code.toLowerCase();
  const known = NFL_TEAMS.find(([abbr]) => abbr === normalized);
  if (!known) return null;
  try {
    const data = await fetchJson<TeamScheduleResponse>(`${ESPN_BASE}/teams/${normalized}/schedule`);
    const games = (data.events ?? []).map(normalizeEvent).filter((game): game is GameView => Boolean(game));
    const now = Date.now();
    const finals = games.filter((game) => new Date(game.date).getTime() < now && /final/i.test(game.status));
    const upcoming = games.filter((game) => new Date(game.date).getTime() >= now && !/final/i.test(game.status));
    let nextGame = upcoming[0] ?? null;
    if (nextGame) {
      const date = easternDateKey(new Date(nextGame.date));
      const scoreboard = await fetchJson<ScoreboardResponse>(`${ESPN_BASE}/scoreboard?dates=${date}`);
      const enriched = (scoreboard.events ?? [])
        .map(normalizeEvent)
        .find((game) => game?.id === nextGame?.id);
      if (enriched) nextGame = enriched;
    }
    const team = data.team ? teamView(data.team) : {
      abbreviation: normalized.toUpperCase(), name: known[1],
      shortName: known[1].split(" ").slice(-1)[0],
      logo: `https://a.espncdn.com/i/teamlogos/nfl/500/${normalized}.png`,
    };
    return { team, lastGame: finals.at(-1) ?? null, nextGame };
  } catch (error) {
    console.error(`Unable to load ${normalized} schedule`, error);
    if (typeof window !== "undefined") throw error;
    return null;
  }
}

export async function getSpotlightGames(kind: SpotlightKind) {
  try {
    const now = new Date();
    const currentYear = Number(easternDateParts(now).year);
    const years = [currentYear, currentYear + 1];
    const allEvents: EspnEvent[] = [];
    for (const year of years) {
      const data = await fetchJson<ScoreboardResponse>(`${ESPN_BASE}/scoreboard?limit=1000&dates=${year}`);
      allEvents.push(...(data.events ?? []));
      if (kind !== "thanksgiving" && year === currentYear && allEvents.some((event) => new Date(event.date).getTime() >= now.getTime())) break;
    }

    const currentThanksgiving = thanksgivingDateKey(currentYear);
    const thanksgiving = easternDateKey(now) <= currentThanksgiving
      ? currentThanksgiving
      : thanksgivingDateKey(currentYear + 1);
    const upcoming = allEvents
      .map(normalizeEvent)
      .filter((game): game is GameView => Boolean(game))
      .filter((game) => !/final/i.test(game.status))
      .filter((game) => new Date(game.date).getTime() >= now.getTime() - 6 * 60 * 60 * 1000)
      .filter((game) => {
        const { weekday, hour } = easternWeekdayAndHour(game.date);
        if (kind === "thanksgiving") return easternDateKey(new Date(game.date)) === thanksgiving;
        if (kind === "monday") return weekday === "Monday" && hour >= 17;
        if (kind === "sunday") return weekday === "Sunday" && hour >= 17;
        return weekday === "Thursday" && hour >= 18;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (!upcoming.length) return { date: null, games: [] as GameView[] };
    const nextDate = easternDateKey(new Date(upcoming[0].date));
    return {
      date: nextDate,
      games: upcoming.filter((game) => easternDateKey(new Date(game.date)) === nextDate),
    };
  } catch (error) {
    console.error(`Unable to load ${kind} games`, error);
    if (typeof window !== "undefined") throw error;
    return { date: null, games: [] as GameView[] };
  }
}

export function teamPlaysToday(data: TeamPageData) {
  if (!data.nextGame) return false;
  return easternDateKey(new Date(data.nextGame.date)) === easternDateKey(new Date());
}

export function formatKickoff(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN, weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit", timeZoneName: "short",
  }).format(new Date(date));
}

export function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN, weekday: "long", month: "long", day: "numeric",
  }).format(parseEspnDate(date));
}

export function getSlateHeading(daysAhead: number) {
  if (daysAhead === 0) return "Today’s games";
  if (daysAhead === 1) return "Tomorrow’s games";
  const target = new Date(Date.now() + daysAhead * 86_400_000);
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: EASTERN, weekday: "long" }).format(target);
  return `${weekday}’s games`;
}

export function resultForTeam(game: GameView, abbreviation: string) {
  const mine = game.home.abbreviation === abbreviation ? game.home : game.away;
  const opponent = game.home.abbreviation === abbreviation ? game.away : game.home;
  return {
    result: mine.winner ? "W" : "L",
    score: `${mine.shortName} ${mine.score ?? "—"}, ${opponent.shortName} ${opponent.score ?? "—"}`,
  };
}
