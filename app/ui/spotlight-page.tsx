"use client";

import { useEffect, useState } from "react";
import { GameCard } from "@/app/ui/game-card";
import { SiteHeader } from "@/app/ui/site-header";
import { TimeZoneSelector, useTimeZone } from "@/app/ui/time-zone";
import { formatKickoff, formatLongDate, getSpotlightCopy, getSpotlightGames, type GameView, type SpotlightKind } from "@/app/lib/nfl";

type SpotlightSlate = { date: string | null; games: GameView[] };

export function SpotlightPage({ kind }: { kind: SpotlightKind }) {
  const { timeZone } = useTimeZone();
  const copy = getSpotlightCopy(kind);
  const [slate, setSlate] = useState<SpotlightSlate>({ date: null, games: [] });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const timeQuestions: Record<SpotlightKind, string> = {
    monday: "What time is Monday Night Football?",
    sunday: "What time is Sunday Night Football?",
    thursday: "What time is Thursday Night Football?",
    thanksgiving: "What time are the Thanksgiving NFL games?",
  };

  useEffect(() => {
    getSpotlightGames(kind).then(setSlate).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, [kind]);

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
      <section className="special-hero"><p className="eyebrow">{copy.shortTitle}</p><h1>{copy.title}</h1><p>{copy.description}</p></section>
      <section className="special-content" aria-live="polite" aria-busy={loading}>
        <TimeZoneSelector />
        {loading ? <div className="offseason-panel"><span className="offseason-mark" aria-hidden="true">🏈</span><div><h2>Checking the live schedule…</h2><p>Kickoff details are loading.</p></div></div> : slate.date ? (
          <><div className="special-answer"><div><p className="eyebrow">Next broadcast</p><h2>{formatLongDate(slate.date)}</h2></div></div><div className="game-grid">{slate.games.map((game) => <GameCard key={game.id} game={game} />)}</div><div className="search-answer"><h2>{timeQuestions[kind]}</h2><p>{kind === "thanksgiving" ? `Thanksgiving kickoffs: ${slate.games.map((game) => formatKickoff(game.date, timeZone)).join("; ")}. Channels are listed with each game above.` : `The next game starts ${formatKickoff(slate.games[0].date, timeZone)}. Watch on ${slate.games[0].broadcasts.join(", ") || "a channel to be announced"}.`}</p></div></>
        ) : <div className="offseason-panel"><span className="offseason-mark" aria-hidden="true">🏈</span><div><h2>{failed ? "The feed didn’t connect." : "The matchup isn’t posted yet."}</h2><p>{failed ? "Refresh the page to try the live schedule again." : "Check back after the NFL schedule is announced. We refresh the feed every hour."}</p></div></div>}
      </section>
      <footer><span>Who Plays Tonight</span><span>Independent schedule guide. Not affiliated with or endorsed by the NFL or its broadcast partners.</span></footer>
      </main>
    </>
  );
}
