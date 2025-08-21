# Alpha Drums

## Local Development

```sh
npm install
nvm use # or install Node 20.12.2
npm run dev
```

## Common Scripts

- `npm run dev` — local dev server
- `npm run lint`/`lint:fix` — lints/fixes code
- `npm run typecheck` — type checks TypeScript
- `npm run format`/`format:fix` — Prettier
- `npm run serwist` — generate service worker (PWA)
- `npm run serwist:dev` — preview service worker
- `npm run export` — export static site
- `npm run deploy` — build, export, generate sw, deploy to GH Pages
- `npm run changelog` — update CHANGELOG.md from PRs
- `npm run bump:(patch|minor|major)` — bump version and changelog
- `npm run release` — run semantic-release for CI/CD

## Testing
- `npm run test` — not yet implemented

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
