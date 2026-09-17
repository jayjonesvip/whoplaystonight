import type { GameView } from "@/app/lib/nfl";
import { sitePath } from "@/app/lib/paths";
import { formatKickoff } from "@/app/lib/nfl";

type NetworkMark = { key: string; name: string; logo?: string };

const COMMONS = "https://commons.wikimedia.org/wiki/Special:Redirect/file/";

const LOGOS = {
  abc: `${COMMONS}ABC-2021-LOGO.svg`,
  cbs: `${COMMONS}CBS%20logo%20(2020).svg`,
  espn: `${COMMONS}ESPN%20wordmark.svg`,
  fox: `${COMMONS}Fox%20Broadcasting%20Company%20logo%20(2019).svg`,
  nbc: `${COMMONS}NBC%20Peacock%20(2022;%20outlined).svg`,
  nflNetwork: `${COMMONS}NFL%20Network%20logo.svg`,
  peacock: `${COMMONS}NBCUniversal%20Peacock%20Logo.svg`,
  primeVideo: `${COMMONS}Prime%20Video%20logo%20(2024).svg`,
} as const;

function expandNetwork(name: string): NetworkMark[] {
  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  if (key === "nbc") return [
    { key: "nbc", name: "NBC", logo: LOGOS.nbc },
    { key: "peacock", name: "Peacock", logo: LOGOS.peacock },
  ];
  if (key === "espn" || key === "espn2") return [
    { key, name: name.toUpperCase(), logo: LOGOS.espn },
    { key: "espn-app", name: "ESPN App", logo: LOGOS.espn },
  ];
  if (key === "prime-video" || key === "amazon-prime-video") return [
    { key: "prime-video", name: "Prime Video", logo: LOGOS.primeVideo },
  ];
  if (key === "cbs") return [{ key, name: "CBS", logo: LOGOS.cbs }];
  if (key === "fox") return [{ key, name: "FOX", logo: LOGOS.fox }];
  if (key === "abc") return [{ key, name: "ABC", logo: LOGOS.abc }];
  if (key === "nfl-network") return [{ key, name: "NFL Network", logo: LOGOS.nflNetwork }];
  return [{ key, name }];
}

function NetworkBadge({ mark }: { mark: NetworkMark }) {
  return (
    <span className={`network-badge network-${mark.key}${mark.logo ? " has-logo" : ""}`}>
      {mark.logo ? <img src={mark.logo} alt="" aria-hidden="true" width="72" height="24" /> : null}
      <span>{mark.name}</span>
    </span>
  );
}

function TeamRow({ team }: { team: GameView["home"] }) {
  return (
    <a href={sitePath(`/teams/${team.abbreviation.toLowerCase()}/`)} className="matchup-team">
      <img src={team.logo} alt="" aria-hidden="true" width="62" height="62" />
      <span><strong>{team.shortName}</strong><small>{team.record ?? team.abbreviation}</small></span>
      {team.score != null ? <b className="game-score">{team.score}</b> : null}
    </a>
  );
}

export function GameCard({ game }: { game: GameView }) {
  const networkMarks = [...new Map(
    game.broadcasts.flatMap(expandNetwork).map((mark) => [mark.key, mark])
  ).values()];
  return (
    <article className="game-card" aria-label={`${game.away.name} at ${game.home.name}`}>
      <div className="game-meta"><span>{formatKickoff(game.date)}</span><span className="game-status">{game.status}</span></div>
      <div className="matchup"><TeamRow team={game.away} /><div className="at-mark">AT</div><TeamRow team={game.home} /></div>
      <div className="watch-row">
        <span className="watch-label">WATCH ON</span>
        <div className="network-list" aria-label="Broadcast options">
          {networkMarks.length ? networkMarks.map((mark) => <NetworkBadge key={mark.key} mark={mark} />) : <span className="network-tbd">Channel TBD</span>}
        </div>
      </div>
    </article>
  );
}
