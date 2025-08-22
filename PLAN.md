# Project Plan
Full plan:

* Make a markdown plan and tick the boxes with all items as we go through
* make a git commit on every step using Commit Message Guidelines (https://www.conventionalcommits.org/en/v1.0.0/#specification)
I want to setup the ci/cd with proper nvm, and node versions, so I don't have issues running this app in a few years. 1. setup prettier, eslint, and typescript (very strictly, not allowing any, and avoic casting, etc), also nvm with node version
1. 1 I want to be able to run this app in a few years, so any dot files, and forcing versions on package.json that will help that is welcome
2. this is a web app that will be running on the github pages, I want to have scripts to run tests beforing merging
3. setup ci/cd on github pipelines
4. setup automatic bumping, auto merging for minor/patches, and pr that needs review for major bumps
5. this app is also a pwa, that should be installable on iphone and android
6. we should keep the readme up to date with devloop, and best practices, also how CI/CD works
7. we should have playwright for testing every feature of the app
8. we need a setup for vscode and cursor to help debugging the app, debug unit tests in Jest with react testing lib, and playwright as well
9. setup scripts to update the app with options to select major/minor/patch, the script should also get all latest commits (PR requests) and update the CHANGELOG.md
10. setup pre-commit hooks, and pre-push hooks via husky, lint-staged, and comimtlint, and any other great tooling to help with devloop and standard for example from https://github.com/conventional-changelog


Steps to proceed:
- [x] 1. Setup Prettier, ESLint (strict), TypeScript (strict), NVM (force Node version), dotfiles, package versions
- [x] 2. Add scripts to run tests before merging
- [x] 3. Setup GitHub Actions CI/CD for builds and deployment
- [x] 4. Configure automatic version bumping, automerge/minor, PR for major
- [x] 5. Ensure app is a PWA installable on iOS/Android
- [x] 6. Keep README updated: dev loop, CI/CD, best practices
- [x] 7. Add Playwright for E2E testing all features
- [x] 8. Configure VSCode/Cursor for optimal debugging (Jest+RTL, Playwright)
- [x] 9. Script for update/release (select version, PRs to CHANGELOG.md)
- [x] 10. Setup Husky, lint-staged, commitlint, best pre-commit/push hooks
- [x] 11. Multiple languages. By default English, and translated to Brazilian Portuguese.

For the Play We will display an alphatab player that will load a guitar pro file (on browser file input) and display a player that has multiple features

Use the `AlphaTabPlayground` and `AlphaTabFull` components as reference. `~/Sites/Github/alphaTabWebsite/src/components/`.

All the features should have a playwright test, and you should validate if the tests are passing.

Here is a list of features the app will have (tick as you as finished):
- [x] 1. play a guitar pro file
- [x] 2. have a way to display track settings:
  - [x] a. show toggle
  - [x] b. track volume
  - [x] c. play solo
  - [x] d. mute track
  - [ ] e. notation display options (standard, tab, rhythm)
- [ ] 3. have a toggle for loop (on/off)
- [ ] 4. control for metronome (on/off) with volume control
- [ ] 5. bpm speed control (playback speed)
  - [ ] a. should display original bpm (100%)
  - [ ] b. option to select by percentage and/or bpm
  - [ ] c. option to automatic increase by X bpm after Y bars
- [ ] 6. control for count-in (on/off) with volume control
- [ ] 7. zoom control
- [ ] 8. loop control
- [ ] 9. Settings for Display
- [ ] 10. Settings for Player
- [ ] 11. Settings for Stylesheet
- [ ] 12. Settings for Notation
- [ ] 13. Layout options (horizontal, vertical, scroll, etc)
- [ ] 14. Export options (midi, guitar pro, musicxml, print)
