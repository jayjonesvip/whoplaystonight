# Who Plays Tonight

A fast, mobile-first NFL game guide showing today's slate, kickoff times, broadcast and streaming options, every team's next game, and the previous game score.

## Highlights

- ESPN schedule snapshots refreshed at midnight and noon Eastern Time
- Game details rendered into static HTML, with no browser requests to the ESPN feed
- Eastern kickoff times by default, with a remembered browser-timezone choice
- Pages for all 32 NFL teams
- Monday, Thursday, and Sunday Night Football pages
- Thanksgiving football schedule
- Installable PWA with offline app shell
- Search-focused metadata, canonical URLs, sitemap, and robots file
- Keyboard navigation, skip link, live-region updates, reduced-motion support, and accessible labels

## Local development

Requires Node.js 24 and pnpm 11.25.0.

```bash
pnpm install
pnpm run build:github
pnpm lint
pnpm test
pnpm verify:export
```

The static site is generated in `out/`.

`pnpm data:refresh` downloads the ESPN data and writes a validated, normalized `public/data/nfl.json`. Both development startup and production builds run it automatically. To rebuild using an existing local snapshot without another ESPN request, use `pnpm exec next build`.

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` refreshes and deploys on pushes to `main`, on manual runs, and at **12:00 a.m. and 12:00 p.m. America/New_York** every day. The schedule follows EDT/EST automatically. In the repository settings, choose **GitHub Actions** as the Pages source. To refresh manually, run **Deploy Who Plays Tonight** from the Actions tab.

The refresh fetches all 32 team schedules and the previous, current, and next calendar-year scoreboards, merges game IDs, and keeps only fields used by the application. The generated JSON is published at `/data/nfl.json` and included in the Pages artifact; it is not committed to Git. Next.js reads it during export and passes only each page's relevant games to its interactive components. There is no client schedule fetch, polling, or localStorage data cache. Timezone preferences are still remembered locally.

If ESPN fails after retries or a snapshot fails validation, the workflow stops before deployment and the last successful site stays online. Pages show the snapshot timestamp; scores and changes reflect that update rather than live play. GitHub may delay scheduled starts, and may disable schedules in a public repository after 60 days without repository activity.

The included `CNAME` points the site to `whoplaystonight.com`.

The build reads the configured Pages base path automatically, so CSS, JavaScript, navigation, and PWA assets work at either the project URL or a configured custom domain. To test the project URL locally, build with `NEXT_PUBLIC_BASE_PATH=/whoplaystonight`. Without that variable, local builds use the domain root.

## Data and trademarks

Schedule data is loaded from ESPN's public site feed. Who Plays Tonight is an independent schedule guide and is not affiliated with or endorsed by the NFL, its teams, ESPN, or other broadcast partners. Team and network marks identify the related teams and broadcasts.
