## <small>1.4.1 (2025-08-22)</small>

* Merge pull request #11 from leocaseiro/alphatab-integration ([f4b8191](https://github.com/leocaseiro/alpha-drums/commit/f4b8191)), closes [#11](https://github.com/leocaseiro/alpha-drums/issues/11)
* fix(render): load notation on gh-pages ([34cb540](https://github.com/leocaseiro/alpha-drums/commit/34cb540))
* fix(sw): remove sw from local ([c911f6c](https://github.com/leocaseiro/alpha-drums/commit/c911f6c))

## 1.4.0 (2025-08-22)

* Merge pull request #10 from leocaseiro/alphatab-integration ([0de858a](https://github.com/leocaseiro/alpha-drums/commit/0de858a)), closes [#10](https://github.com/leocaseiro/alpha-drums/issues/10)
* Merge pull request #6 from leocaseiro/chore/fix-automerge ([b4a7cfd](https://github.com/leocaseiro/alpha-drums/commit/b4a7cfd)), closes [#6](https://github.com/leocaseiro/alpha-drums/issues/6)
* fix(alphaTab.PlayerMode): set correct enum as alphaTab.PlayerMode.EnabledAutomatic ([67880d7](https://github.com/leocaseiro/alpha-drums/commit/67880d7))
* fix(alphatab): resolve infinite render loop and font loading issues ([a0253f4](https://github.com/leocaseiro/alpha-drums/commit/a0253f4))
* fix(alphatab): resolve scoreLoaded.trigger initialization error ([0b27acf](https://github.com/leocaseiro/alpha-drums/commit/0b27acf))
* fix(assets): resolve alphatab font and worker loading issues ([cfae631](https://github.com/leocaseiro/alpha-drums/commit/cfae631))
* fix(i18n): persist selected language to localStorage for cross-route sync ([c398f4c](https://github.com/leocaseiro/alpha-drums/commit/c398f4c))
* fix(i18n): sync language state from localStorage on mount (with useEffect) for route persistence ([37ec6f2](https://github.com/leocaseiro/alpha-drums/commit/37ec6f2))
* fix(render): loading notation without audio ([d98bda7](https://github.com/leocaseiro/alpha-drums/commit/d98bda7))
* fix(rendering): resolve infinite render loop and enable notation display ([f600f79](https://github.com/leocaseiro/alpha-drums/commit/f600f79))
* fix(ts): remove any and improve TS ([87b62ca](https://github.com/leocaseiro/alpha-drums/commit/87b62ca))
* fix(ui): resolve loading overlay blocking file input interface ([6c798e0](https://github.com/leocaseiro/alpha-drums/commit/6c798e0))
* docs(readme): comprehensive documentation of implemented features ([246caca](https://github.com/leocaseiro/alpha-drums/commit/246caca))
* feat(export): implement export and print functionality with e2e tests ([c38dcac](https://github.com/leocaseiro/alpha-drums/commit/c38dcac))
* feat(i18n): add multiple languages (en, pt-BR) support with switcher and language JSONs\n\n- Adds I1 ([cdc2adc](https://github.com/leocaseiro/alpha-drums/commit/cdc2adc))
* feat(player): add zoom control, layout options, and unit testing ([444f501](https://github.com/leocaseiro/alpha-drums/commit/444f501))
* feat(player): implement basic alphatab guitar pro file player ([28bd873](https://github.com/leocaseiro/alpha-drums/commit/28bd873))
* feat(player): implement comprehensive playback controls ([f7d2a87](https://github.com/leocaseiro/alpha-drums/commit/f7d2a87))
* feat(tracks): implement comprehensive track control system ([d57139c](https://github.com/leocaseiro/alpha-drums/commit/d57139c))
* chore(auto-merge): fix auto-merge to only merge when everything is green ([80d2012](https://github.com/leocaseiro/alpha-drums/commit/80d2012))
* chore(releases): remove assets from releases ([63817c9](https://github.com/leocaseiro/alpha-drums/commit/63817c9))

## 1.3.0 (2025-08-21)

* chore(ts) remove playrwight from yarn build ([aab35c8](https://github.com/leocaseiro/alpha-drums/commit/aab35c8))
* Merge pull request #5 from leocaseiro/feat/devloop-improvements ([2c57812](https://github.com/leocaseiro/alpha-drums/commit/2c57812)), closes [#5](https://github.com/leocaseiro/alpha-drums/issues/5)
* update nvm to 20.19, and fix playrwright tests ([ede0233](https://github.com/leocaseiro/alpha-drums/commit/ede0233))
* chore(gh-actions): make sure we use node 20.19 for all actions ([cceef58](https://github.com/leocaseiro/alpha-drums/commit/cceef58))
* chore(tooling): setup husky, lint-staged, and commitlint ([7026bd7](https://github.com/leocaseiro/alpha-drums/commit/7026bd7))
* chore(yarn): force to use yarn over npm ([88fa703](https://github.com/leocaseiro/alpha-drums/commit/88fa703))
* feat(e2e): add Playwright with example test and config ([d2448f7](https://github.com/leocaseiro/alpha-drums/commit/d2448f7))
* feat(router): setup router with 2 pages ([73652a5](https://github.com/leocaseiro/alpha-drums/commit/73652a5))
* ci(playwright): add workflow to run tests on pull requests ([82fea1c](https://github.com/leocaseiro/alpha-drums/commit/82fea1c))
* docs: update plan for README task ([1ad3ecd](https://github.com/leocaseiro/alpha-drums/commit/1ad3ecd))
* docs: update README with latest scripts and test status ([89409ad](https://github.com/leocaseiro/alpha-drums/commit/89409ad))

## [1.2.0](https://github.com/leocaseiro/alpha-drums/compare/v1.1.0...v1.2.0) (2025-08-21)

### Features

* add auto-merge workflow options ([232ca43](https://github.com/leocaseiro/alpha-drums/commit/232ca4371396e3df83bd14710a45d280e9e9bc1b))

## [1.1.0](https://github.com/leocaseiro/alpha-drums/compare/v1.0.0...v1.1.0) (2025-08-21)

### Features

* restore full semantic-release config for feature branch workflow ([1d31fa2](https://github.com/leocaseiro/alpha-drums/commit/1d31fa2355964aefbd60a5e453894f619a854f0b))

### Bug Fixes

* **assets:** add basePath support for public assets on GitHub Pages ([723f73d](https://github.com/leocaseiro/alpha-drums/commit/723f73dc47b0647c352dee6a9523fefadc91f5ec))
* **semantic-release:** simplify configuration to avoid git conflicts ([eed44fe](https://github.com/leocaseiro/alpha-drums/commit/eed44fe8d13f5fbeff0c9e8a6fb0c93fb3b388cc))

## 1.0.0 (2025-08-21)

### Features

* **package-manager:** enforce yarn usage and Node.js version consistency ([8d9e448](https://github.com/leocaseiro/alpha-drums/commit/8d9e4481c3e22ea07137888911c1106f7dcc5b7c))
* **pwa:** add next-pwa for installable PWA support ([86c49bd](https://github.com/leocaseiro/alpha-drums/commit/86c49bdce787ea0b9219534c29273895e9e09a36))
* **pwa:** setup Serwist PWA config, manifest, and layout updates ([666821c](https://github.com/leocaseiro/alpha-drums/commit/666821cde19ba1efffd1ef3b1a8f6574fd6505a2))

### Bug Fixes

* **ci:** add permissions to release workflow for semantic-release ([aaed942](https://github.com/leocaseiro/alpha-drums/commit/aaed9420b421627c17afc14c93f35d5e0ca4ba70))
* **ci:** update all workflows to use yarn instead of npm ([44d28e1](https://github.com/leocaseiro/alpha-drums/commit/44d28e1f845ad43db24ca2d00468d4ca61b4cca8))
* **ci:** update GitHub Pages deployment to use GitHub Actions method ([d9d8920](https://github.com/leocaseiro/alpha-drums/commit/d9d892026c11c0ed51a2c657222b5eab04eb3909))
* **ci:** update Node.js version requirement to 20+ for semantic-release compatibility ([52dc058](https://github.com/leocaseiro/alpha-drums/commit/52dc058f4fce44421f24f5a85825b61df1343d30))
* **deployment:** update serwist and Next.js 15 compatibility ([ff948a9](https://github.com/leocaseiro/alpha-drums/commit/ff948a9a8fb0693ddfd2d251d731764731147d39))
* **github-pages:** add basePath configuration for correct asset paths ([e44f438](https://github.com/leocaseiro/alpha-drums/commit/e44f43820294b43e67e8dfac038df920856cecf0))
