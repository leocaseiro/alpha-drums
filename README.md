# Alpha Drums

A web-based guitar tab player built with Next.js and AlphaTab. Load Guitar Pro files and enjoy a full-featured music player with track controls, metronome, and export capabilities.

## Features

✅ **Core Player**
- Guitar Pro file support (.gp, .gp3, .gp4, .gp5, .gpx, .musicxml)
- Drag & drop file loading
- Play/pause/stop controls
- Progress bar with seek functionality

✅ **Track Management**
- Individual track show/hide toggles
- Volume control per track (0-16 range)
- Solo and mute functionality
- Visual track identification (drums/guitar icons)

✅ **Playback Controls**
- Loop toggle
- Metronome with volume control
- Count-in with volume control
- Playback speed control (25%-200%)
- Zoom control (25%-200%)

✅ **Layout & Export**
- Layout options (page/horizontal modes)
- Export to Guitar Pro format
- Print functionality
- Responsive design for mobile/desktop

✅ **Internationalization**
- English and Brazilian Portuguese support
- Language switcher
- All UI elements translated

✅ **Testing & Quality**
- Unit tests with Jest and React Testing Library
- E2E tests with Playwright
- TypeScript strict mode
- ESLint and Prettier integration

## Local Development

```sh
yarn install
nvm use # or install Node 20.19+
yarn dev
```

## Common Scripts

- `yarn dev` — local dev server
- `yarn test` — run unit tests with Jest
- `yarn test:watch` — run unit tests in watch mode
- `yarn test:e2e` — run Playwright E2E tests
- `yarn test:e2e:ui` — run Playwright tests with UI
- `yarn lint`/`lint:fix` — lints/fixes code
- `yarn typecheck` — type checks TypeScript
- `yarn format`/`format:fix` — Prettier
- `yarn serwist` — generate service worker (PWA)
- `yarn serwist:dev` — preview service worker
- `yarn deploy` — build, export, generate sw, deploy to GH Pages
- `yarn changelog` — update CHANGELOG.md from PRs
- `yarn bump:(patch|minor|major)` — bump version and changelog
- `yarn release` — run semantic-release for CI/CD

## CI/CD
- See workflows in `.github/workflows/`
- Lint, build and release run on PRs/merges

## PWA
- Uses [Serwist](https://serwist.pages.dev/docs/next)
- Manifest: `/public/manifest.webmanifest`

## Deploying on GitHub Pages
- Pushing to the `main` branch automatically triggers a deployment to the `gh-pages` branch via GitHub Actions.
- Or run `npm run deploy` (needs `gh-pages` CLI, `out` folder)

## Enable on GitHub Pages
1. In repo settings, go to Pages
2. Set Source to "GitHub Actions"
3. Push to `main` branch to trigger deployment

---

See PLAN.md for task status and roadmap.
