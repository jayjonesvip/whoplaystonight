# Who Plays Tonight

A fast, mobile-first NFL game guide showing today's slate, kickoff times, broadcast and streaming options, every team's next game, and the previous game score.

## Highlights

- Live schedule data with hourly browser caching
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
```

The static site is generated in `out/`.

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` deploys automatically on pushes to `main` and can also be run manually. In the repository settings, choose **GitHub Actions** as the Pages source. To deploy manually, run **Deploy Who Plays Tonight** from the Actions tab.

The included `CNAME` points the site to `whoplaystonight.com`.

The build reads the configured Pages base path automatically, so CSS, JavaScript, navigation, and PWA assets work at either the project URL or a configured custom domain. To test the project URL locally, build with `NEXT_PUBLIC_BASE_PATH=/whoplaystonight`. Without that variable, local builds use the domain root.

## Data and trademarks

Schedule data is loaded from ESPN's public site feed. Who Plays Tonight is an independent schedule guide and is not affiliated with or endorsed by the NFL, its teams, ESPN, or other broadcast partners. Team and network marks identify the related teams and broadcasts.
