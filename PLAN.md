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
