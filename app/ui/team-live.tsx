"use client";

import { useEffect, useState } from "react";
import { GameCard } from "@/app/ui/game-card";
import { SiteHeader } from "@/app/ui/site-header";
import { TimeZoneSelector, useTimeZone } from "@/app/ui/time-zone";
import { formatKickoff, getTeamPageData, NFL_TEAMS, resultForTeam, teamPlaysToday, type TeamPageData } from "@/app/lib/nfl";

export function TeamLive({ code }: { code: string }) {
  const { timeZone } = useTimeZone();
  const known = NFL_TEAMS.find(([abbr]) => abbr === code.toLowerCase());
  const [data, setData] = useState<TeamPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    getTeamPageData(code).then(setData).catch(() => setFailed(true)).finally(() => setLoading(false));
  }, [code]);

  const fallbackName = known?.[1] ?? "NFL team";
  const fallbackShortName = fallbackName.split(" ").slice(-1)[0];
  const last = data?.lastGame ? resultForTeam(data.lastGame, data.team.abbreviation) : null;
  const playsToday = data ? teamPlaysToday(data) : false;

  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} aria-busy={loading}>
      <section className="team-hero"><img src={data?.team.logo ?? `https://a.espncdn.com/i/teamlogos/nfl/500/${code.toLowerCase()}.png`} alt={`${data?.team.name ?? fallbackName} logo`} width="120" height="120" /><div><p className="eyebrow">Team schedule</p><h1>{data?.team.name ?? fallbackName} Schedule &amp; Next Game</h1></div></section>
      <div className="team-time-zone"><TimeZoneSelector /></div>
      <section className="today-answer" aria-live="polite"><p className="eyebrow">Quick answer</p><h2>Do the {data?.team.shortName ?? fallbackShortName} play today?</h2><p>{loading ? "Checking the live schedule…" : failed ? "The schedule feed didn’t connect. Refresh to try again." : playsToday && data?.nextGame ? `Yes. The ${data.team.shortName} play on today’s NFL slate. Kickoff: ${formatKickoff(data.nextGame.date, timeZone)}.` : data?.nextGame ? `No. Their next game is ${formatKickoff(data.nextGame.date, timeZone)}.` : "No. Their next game has not been scheduled yet."}</p></section>
      {!loading && !failed && data ? <section className="team-content">
        <div className="next-game-block"><p className="eyebrow">Next game</p>{data.nextGame ? <GameCard game={data.nextGame} /> : <div className="offseason-panel compact"><span className="offseason-mark" aria-hidden="true">🏈</span><div><h2>Cleats are in the closet.</h2><p>The next {data.team.shortName} game hasn’t been scheduled yet. Enjoy the quiet while it lasts.</p></div></div>}</div>
        <aside className="last-game-card"><p className="eyebrow">Last game</p>{data.lastGame && last ? <><div className={`result-pill result-${last.result.toLowerCase()}`}>{last.result}</div><h2>{last.score}</h2><p>{formatKickoff(data.lastGame.date, timeZone)}</p></> : <><h2>No final yet</h2><p>The season’s first score is still waiting.</p></>}</aside>
      </section> : null}
      <footer><span>Who Plays Tonight</span><span>Independent schedule guide. Not affiliated with or endorsed by the NFL or its broadcast partners.</span></footer>
      </main>
    </>
  );
}
