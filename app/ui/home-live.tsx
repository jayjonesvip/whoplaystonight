"use client";

import { useEffect, useState } from "react";
import { sitePath } from "@/app/lib/paths";
import { GameCard } from "@/app/ui/game-card";
import { SiteHeader } from "@/app/ui/site-header";
import { findNextSlate, formatLongDate, getAllTeams, getSlateHeading, type GameView } from "@/app/lib/nfl";

type Slate = { date: string; daysAhead: number; games: GameView[] } | null;

const spotlightLinks = [
  ["monday-night-football", "MON", "Monday Night Football"],
  ["thursday-night-football", "THU", "Thursday Night Football"],
  ["sunday-night-football", "SUN", "Sunday Night Football"],
  ["thanksgiving-football", "NOV", "Thanksgiving Football"],
] as const;

export function HomeLive() {
  const [slate, setSlate] = useState<Slate>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    findNextSlate().then(setSlate).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, []);

  const teams = getAllTeams(slate?.games ?? []);

  return (
    <>
      <SiteHeader showTeams />
      <main id="main-content" tabIndex={-1}>
      <section className="slate-shell" aria-labelledby="slate-title" aria-busy={loading}>
        <div className="slate-heading">
          <div><p className="eyebrow">{slate ? formatLongDate(slate.date) : "NFL schedule"}</p><h1 id="slate-title">{loading ? "Loading today’s games…" : slate ? getSlateHeading(slate.daysAhead) : failed ? "The schedule feed is unavailable." : "The league is catching its breath."}</h1><p className="slate-summary">NFL kickoff times, TV channels, and streaming options.</p></div>
          <div className="update-note" role="status"><span className="live-dot" aria-hidden="true" />Updated hourly · Times ET</div>
        </div>
        {slate ? <div className="game-grid">{slate.games.map((game) => <GameCard key={game.id} game={game} />)}</div> : !loading ? (
          <div className="offseason-panel" role="status"><span className="offseason-mark" aria-hidden="true">🏈</span><div><h2>{failed ? "The feed didn’t connect." : "The grass is resting."}</h2><p>{failed ? "Refresh the page to try the live schedule again." : "No NFL games are scheduled this week. The next kickoff will find its way here."}</p></div></div>
        ) : null}
      </section>
      <section className="spotlight-section">
        <div className="section-title"><p className="eyebrow">Primetime & holidays</p><h2>Big nights, quick answers</h2></div>
        <div className="spotlight-grid">{spotlightLinks.map(([href, day, label]) => <a href={sitePath(`/${href}/`)} className="spotlight-link" key={href}><span>{day}</span><strong>{label}</strong><b aria-hidden="true">→</b></a>)}</div>
      </section>
      <section className="teams-section" id="teams">
        <div className="section-title"><p className="eyebrow">All 32 clubs</p><h2>Find your team</h2></div>
        <div className="team-link-grid">{teams.map((team) => <a key={team.abbreviation} href={sitePath(`/teams/${team.abbreviation.toLowerCase()}/`)} className="team-link"><img src={team.logo} alt="" aria-hidden="true" width="40" height="40" /><span>{team.shortName}</span></a>)}</div>
      </section>
      <footer><span>Who Plays Tonight</span><span>Independent schedule guide. Not affiliated with or endorsed by the NFL or its broadcast partners.</span></footer>
      </main>
    </>
  );
}
