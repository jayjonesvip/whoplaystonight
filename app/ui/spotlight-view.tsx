"use client";

import { GameCard } from "@/app/ui/game-card";
import { SiteHeader } from "@/app/ui/site-header";
import { TimeZoneSelector, useTimeZone } from "@/app/ui/time-zone";
import { formatKickoff } from "@/app/lib/time";
import { formatLongDate, getSpotlightCopy, type SpotlightSlate, type SpotlightKind } from "@/app/lib/nfl";

export function SpotlightView({ kind, slate, updatedAt }: { kind: SpotlightKind; slate: SpotlightSlate; updatedAt: string }) {
  const { timeZone } = useTimeZone();
  const copy = getSpotlightCopy(kind);
  const timeQuestions: Record<SpotlightKind, string> = {
    monday: "What time is Monday Night Football?",
    sunday: "What time is Sunday Night Football?",
    thursday: "What time is Thursday Night Football?",
    thanksgiving: "What time are the Thanksgiving NFL games?",
  };

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
      <section className="special-hero"><p className="eyebrow">{copy.shortTitle}</p><h1>{copy.title}</h1><p>{copy.description}</p></section>
      <section className="special-content" aria-live="polite">
        <TimeZoneSelector updatedAt={updatedAt} />
        {slate.date ? (
          <><div className="special-answer"><div><p className="eyebrow">Next broadcast</p><h2>{formatLongDate(slate.date)}</h2></div></div><div className="game-grid">{slate.games.map((game) => <GameCard key={game.id} game={game} />)}</div><div className="search-answer"><h2>{timeQuestions[kind]}</h2><p>{kind === "thanksgiving" ? `Thanksgiving kickoffs: ${slate.games.map((game) => formatKickoff(game.date, timeZone)).join("; ")}. Channels are listed with each game above.` : `The next game starts ${formatKickoff(slate.games[0].date, timeZone)}. Watch on ${slate.games[0].broadcasts.join(", ") || "a channel to be announced"}.`}</p></div></>
        ) : <div className="offseason-panel"><span className="offseason-mark" aria-hidden="true">🏈</span><div><h2>The matchup isn’t posted yet.</h2><p>Check back after the NFL schedule is announced. Schedules update at midnight and noon Eastern.</p></div></div>}
      </section>
      <footer><span>Who Plays Tonight</span><span>Independent schedule guide. Not affiliated with or endorsed by the NFL or its broadcast partners.</span></footer>
      </main>
    </>
  );
}
