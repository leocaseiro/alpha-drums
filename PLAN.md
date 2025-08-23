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

### Licensing
- [x] Add MPL-2.0 license and update package metadata and README

### UI Migration to Chakra UI (on branch `chakra-ui`)
- [x] Install Chakra UI and dependencies (`@chakra-ui/react`, `@emotion/react`, `@emotion/styled`, `framer-motion`)
- [x] Wrap app with `ChakraProvider`, `ColorModeScript` in `src/app/layout.tsx`
- [x] Replace global fonts & base colors with Chakra theme tokens
- [x] Migrate loading overlay to Chakra `ProgressCircle` with dynamic progress
- [x] Add `Toast` notifications for load, error, success
- [x] Convert `PlayerControls` to Chakra components (Buttons, Sliders, Select, Stack)
- [x] Convert `TrackItem` to Chakra components (Card, ButtonGroup, Slider)
- [x] Replace CSS Modules with Chakra style props where feasible
- [x] Implement top Menubar with Chakra `Menu`/`ActionBar`
- [x] Implement Drawer/Sidebar for Settings (Features 2.e, 8-12)
- [x] Add Switch components for track visibility
- [x] Add Editable inputs for numeric controls with reset buttons
- [x] Make Tracks sidebar toggleable and resizable (use Chakra + CSS)
- [x] Replace export action UI with Chakra `ActionBar`

For the Play We will display an alphatab player that will load a guitar pro file (on browser file input) and display a player that has multiple features

Use the `AlphaTabPlayground` and `AlphaTabFull` components as reference. `~/Sites/Github/alphaTabWebsite/src/components/`.

All the features should have a playwright test, and you should validate if the tests are passing.

## Features
- [x] 1. play a guitar pro file
- [x] 2. have a way to display track settings:
  - [x] a. show toggle
  - [x] b. track volume
  - [x] c. play solo
  - [x] d. mute track
  - [x] e. notation display options (standard, tab, rhythm)
- [x] 3. have a toggle for loop (on/off)
- [x] 4. control for metronome (on/off) with volume control
- [x] 5. bpm speed control (playback speed)
  - [x] a. should display original bpm (100%)
  - [x] b. option to select by percentage and/or bpm
  - [ ] c. option to automatic increase by X bpm after Y bars
- [x] 6. control for count-in (on/off) with volume control
- [x] 7. zoom control
- [x] 8. loop control
- [x] 9. Settings for Display
- [x] 10. Settings for Player
- [x] 11. Settings for Stylesheet
- [x] 12. Settings for Notation
- [x] 13. Layout options (horizontal, vertical, scroll, etc)
- [x] 14. Export options (midi, guitar pro, musicxml, print)
- [x] 15. The Load file should be available as a button even after loading a file (in case I want to play another song).
- [ ] 16. there is a bug on iOS that some files cannot be selected. eg. `*.gp`, but I can select `*.gp4`, and `*.gp5`.
- [x] 17. the player should be controller by keyboard as well
- [x] 18. The player bar should be able to move the position of the song, interactive slider implemented
- [x] 19. Change the loading animation to use https://chakra-ui.com/docs/components/progress-circle
- [x] 20. The Export options working via menu system (ActionBar equivalent)
- [x] 21. Tracks sidebar toggleable and resizable via MenuBar
- [x] 22. Implement the settings from (Features 2.e, 8-12) via drawer component
- [x] 23. Menubar implemented on top of the app with File/View menus
- [x] 24. Toast notifications for loading, errors, and success implemented
- [x] 25. Player cursor, animation, and scrolling fixed with proper viewport setup
- [x] 26. Track visibility using Switch components implemented
- [x] 27. Editable inputs for all numeric controls with reset buttons implemented
- [x] 28. By default, we should only have to display the drums track (channel 10 for percussion)
- [x] 29. we should have a way to show only track selected as well.
<!-- - [ ] 30. we should have a playwright passing for every feature -->

## Midi Features https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API (new branch after UI changes)
- [ ] 1. Implement a way to detect midi inputs (ref: https://github.com/sightread/sightread/blob/main/src/features/midi/index.tsx)
  - [ ] a. should automatic midi inputs, and outputs
  - [ ] b. user should select what midi to subscribe as input, or disable all, if only one available, select it by default (ref: https://github.com/sightread/sightread/blob/main/src/hooks/useMidiInputs.ts)
  - [ ] c. user should select what midi to subscribe as output, or disable all, if only one available, disabled by default (ref: https://github.com/sightread/sightread/blob/main/src/hooks/useMidiOutputs.ts)
  - [ ] d. we should persist those settings in case we refresh the app
  - [ ] e. we should automatic update the list if remove/add device
  - [ ] f. auto subscribe on input connect, auto disable when input is removed
  - [ ] g. user should be able to force refresh inputs
  - [ ] h. add a toggle to log the inputs on console, and into a drawer called history, and a way to reset it.
- [ ] 2. Rhytim game
  - [ ] a. the user can select to practice or play score
  - [ ] b. when user click in play score, we should start the song, and also detect if the midi inputs are played correctly
  - [ ] c. we should score streak, accuracy, perfect, early, late, miss, etc and display in percentage, as well as 5 stars.
  - [ ] d. we should use the alphatab colors to detect when user pressed the right note in the right time as a visual feedback using the PercussionNoteHeadGlyph.paint from alphatab https://github.com/CoderLine/alphaTab/blob/main/src/rendering/glyphs/PercussionNoteHeadGlyph.ts#L24-L46
  - [ ] e. if the user miss the note (not played in the time, or too late), we should red, and add black cross (x)
  - [ ] f. for every correct note, we should also wrap the notehead with a green circle.
  - [ ] g. for every extra note (played extra notes), we should display as a cross.
  - [ ] h. we should be able to see our last scores (save as indexedDB with the name of song, when I played last time, and the score in details)
  - [ ] i. we should have a record button, so I could record, and replay my play
  - [ ] h. when I play, I should be able to mute the drum track (or any other track if user select), but it is optional. However, we should still able to listen to the input device (control if play from device or from alphatab synthesizer)
