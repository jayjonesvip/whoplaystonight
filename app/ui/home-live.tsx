"use client";

import { sitePath } from "@/app/lib/paths";
import { GameCard } from "@/app/ui/game-card";
import { SiteHeader } from "@/app/ui/site-header";
import { TimeZoneSelector } from "@/app/ui/time-zone";
import { formatLongDate, getAllTeams, getSlateHeading, type Slate } from "@/app/lib/nfl";

const spotlightLinks = [
  ["monday-night-football", "MON", "Monday Night Football"],
  ["thursday-night-football", "THU", "Thursday Night Football"],
  ["sunday-night-football", "SUN", "Sunday Night Football"],
  ["thanksgiving-football", "NOV", "Thanksgiving Football"],
] as const;

export function HomeLive({ slate, updatedAt }: { slate: Slate; updatedAt: string }) {
  const teams = getAllTeams(slate?.games ?? []);

  return (
    <>
      <SiteHeader showTeams />
      <main id="main-content" tabIndex={-1}>
      <section className="slate-shell" aria-labelledby="slate-title">
        <div className="slate-heading">
          <div><p className="eyebrow">{slate ? formatLongDate(slate.date) : "NFL schedule"}</p><h1 id="slate-title">{slate ? getSlateHeading(slate.daysAhead, slate.date) : "The league is catching its breath."}</h1><p className="slate-summary">NFL kickoff times, TV channels, and streaming options.</p></div>
          <TimeZoneSelector updatedAt={updatedAt} />
        </div>
        {slate ? <div className="game-grid">{slate.games.map((game) => <GameCard key={game.id} game={game} />)}</div> : (
          <div className="offseason-panel" role="status"><span className="offseason-mark" aria-hidden="true">🏈</span><div><h2>The grass is resting.</h2><p>No NFL games are scheduled this week. The next kickoff will find its way here.</p></div></div>
        )}
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
