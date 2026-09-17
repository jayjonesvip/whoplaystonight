const EASTERN = "America/New_York";

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
  completed: boolean;
  state: "pre" | "in" | "post";
  broadcasts: string[];
  away: TeamView & { score?: string; winner?: boolean };
  home: TeamView & { score?: string; winner?: boolean };
};

export type TeamPageData = {
  team: TeamView;
  nextGame: GameView | null;
  lastGame: GameView | null;
};

export type NflSnapshot = {
  schemaVersion: 1;
  updatedAt: string;
  teams: TeamView[];
  games: GameView[];
};

export type Slate = { date: string; daysAhead: number; games: GameView[] } | null;
export type SpotlightSlate = { date: string | null; games: GameView[] };

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

function addDaysEastern(days: number, now: Date) {
  const { year, month, day } = easternDateParts(now);
  const noonUtc = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day) + days, 12));
  const parts = easternDateParts(noonUtc);
  return `${parts.year}${parts.month}${parts.day}`;
}

function parseEspnDate(date: string) {
  return new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T12:00:00Z`);
}

export function findNextSlate(snapshot: NflSnapshot): Slate {
  const now = new Date(snapshot.updatedAt);
  for (let daysAhead = 0; daysAhead <= 8; daysAhead += 1) {
    const date = addDaysEastern(daysAhead, now);
    const games = snapshot.games.filter((game) => easternDateKey(new Date(game.date)) === date);
    if (games.length) return { date, daysAhead, games };
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

export function getTeamPageData(snapshot: NflSnapshot, code: string): TeamPageData | null {
  const team = snapshot.teams.find((item) => item.abbreviation.toLowerCase() === code.toLowerCase());
  if (!team) return null;
  const games = snapshot.games.filter((game) =>
    game.home.abbreviation === team.abbreviation || game.away.abbreviation === team.abbreviation
  );
  const now = new Date(snapshot.updatedAt).getTime();
  const finals = games.filter((game) => game.completed);
  const upcoming = games.filter((game) => !game.completed &&
    (game.state === "in" || new Date(game.date).getTime() >= now));
  return { team, lastGame: finals.at(-1) ?? null, nextGame: upcoming[0] ?? null };
}

export function getSpotlightGames(snapshot: NflSnapshot, kind: SpotlightKind): SpotlightSlate {
  const now = new Date(snapshot.updatedAt);
  const currentYear = Number(easternDateParts(now).year);
  const currentThanksgiving = thanksgivingDateKey(currentYear);
  const thanksgiving = easternDateKey(now) <= currentThanksgiving
    ? currentThanksgiving
    : thanksgivingDateKey(currentYear + 1);
  const upcoming = snapshot.games
    .filter((game) => !game.completed)
    .filter((game) => new Date(game.date).getTime() >= now.getTime() - 6 * 60 * 60 * 1000)
    .filter((game) => {
      const { weekday, hour } = easternWeekdayAndHour(game.date);
      if (kind === "thanksgiving") return easternDateKey(new Date(game.date)) === thanksgiving;
      if (kind === "monday") return weekday === "Monday" && hour >= 17;
      if (kind === "sunday") return weekday === "Sunday" && hour >= 17;
      return weekday === "Thursday" && hour >= 18;
    });
  if (!upcoming.length) return { date: null, games: [] };
  const date = easternDateKey(new Date(upcoming[0].date));
  return { date, games: upcoming.filter((game) => easternDateKey(new Date(game.date)) === date) };
}

export function teamPlaysToday(data: TeamPageData, updatedAt: string) {
  if (!data.nextGame) return false;
  return easternDateKey(new Date(data.nextGame.date)) === easternDateKey(new Date(updatedAt));
}

export function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EASTERN, weekday: "long", month: "long", day: "numeric",
  }).format(parseEspnDate(date));
}

export function getSlateHeading(daysAhead: number, date: string) {
  if (daysAhead === 0) return "Today’s games";
  if (daysAhead === 1) return "Tomorrow’s games";
  const target = parseEspnDate(date);
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
