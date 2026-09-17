import Link from "next/link";
import { PwaInstall } from "@/app/ui/pwa-install";

export function SiteHeader({ showTeams = false }: { showTeams?: boolean }) {
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to game information</a>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="Who Plays Tonight home">
          <img src="/logo-mark.svg" alt="" aria-hidden="true" width="42" height="42" />
          <span className="brand-copy"><strong>WHO PLAYS TONIGHT</strong><small>NFL GAME GUIDE</small></span>
        </Link>
        <nav className="header-actions" aria-label="Main navigation">
          {showTeams ? <a href="#teams">Teams</a> : <Link href="/">All games</Link>}
          <PwaInstall />
        </nav>
      </header>
    </>
  );
}
