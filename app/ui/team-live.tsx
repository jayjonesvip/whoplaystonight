"use client";

import { GameCard } from "@/app/ui/game-card";
import { SiteHeader } from "@/app/ui/site-header";
import { TimeZoneSelector, useTimeZone } from "@/app/ui/time-zone";
import { formatKickoff } from "@/app/lib/time";
import { resultForTeam, teamPlaysToday, type TeamPageData } from "@/app/lib/nfl";

export function TeamLive({ data, updatedAt }: { data: TeamPageData; updatedAt: string }) {
  const { timeZone } = useTimeZone();
  const last = data.lastGame ? resultForTeam(data.lastGame, data.team.abbreviation) : null;
  const playsToday = teamPlaysToday(data, updatedAt);

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1}>
      <section className="team-hero"><img src={data.team.logo} alt={`${data.team.name} logo`} width="120" height="120" /><div><p className="eyebrow">Team schedule</p><h1>{data.team.name} Schedule &amp; Next Game</h1></div></section>
      <div className="team-time-zone"><TimeZoneSelector updatedAt={updatedAt} /></div>
      <section className="today-answer" aria-live="polite"><p className="eyebrow">Quick answer</p><h2>Do the {data.team.shortName} play today?</h2><p>{playsToday && data.nextGame ? `Yes. The ${data.team.shortName} play on today’s NFL slate. Kickoff: ${formatKickoff(data.nextGame.date, timeZone)}.` : data.nextGame ? `No. Their next game is ${formatKickoff(data.nextGame.date, timeZone)}.` : "No. Their next game has not been scheduled yet."}</p></section>
      <section className="team-content">
        <div className="next-game-block"><p className="eyebrow">Next game</p>{data.nextGame ? <GameCard game={data.nextGame} /> : <div className="offseason-panel compact"><span className="offseason-mark" aria-hidden="true">🏈</span><div><h2>Cleats are in the closet.</h2><p>The next {data.team.shortName} game hasn’t been scheduled yet. Enjoy the quiet while it lasts.</p></div></div>}</div>
        <aside className="last-game-card"><p className="eyebrow">Last game</p>{data.lastGame && last ? <><div className={`result-pill result-${last.result.toLowerCase()}`}>{last.result}</div><h2>{last.score}</h2><p>{formatKickoff(data.lastGame.date, timeZone)}</p></> : <><h2>No final yet</h2><p>The season’s first score is still waiting.</p></>}</aside>
      </section>
      <footer><span>Who Plays Tonight</span><span>Independent schedule guide. Not affiliated with or endorsed by the NFL or its broadcast partners.</span></footer>
      </main>
    </>
  );
}
