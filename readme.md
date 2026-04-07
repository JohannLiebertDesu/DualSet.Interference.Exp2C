# jsPsych 8 + Vite + JATOS Template

## Quick start

### First-time setup (once per new study)

- [ ] `npm install` — install dependencies
- [ ] Edit `study-config.json` — set `title`, `dirName`, `description`
- [ ] `npm run init-study` — generates `study.jas` with UUIDs and batch config
- [ ] **Never run `init-study` again** for this study — regenerating UUIDs causes JATOS to treat re-imports as a new study

### Development loop

- [ ] `npm run dev` — start dev server at `localhost:5173`
- [ ] Edit `experiment/src/main.js` (and `consent/`, `debrief/` as needed)
- [ ] Test at `localhost:5173/consent.html`, `/experiment.html`, `/debrief.html`

### Deploy to JATOS

- [ ] `npm run build:jatos` — builds and packages everything into `study.jzip`
- [ ] Import `study.jzip` into JATOS (Studies → Import)
- [ ] First import only: manually configure worker type links in each batch (JATOS does not fully restore batch link state from the `.jas` file)
- [ ] On subsequent deploys: re-run `npm run build:jatos` and re-import — JATOS matches by UUID and updates in place

### Key commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at localhost:5173 |
| `npm run build` | Bundle to `dist/` |
| `npm run build:jatos` | Build + package into `study.jzip` for JATOS |
| `npm run init-study` | Generate `study.jas` (run once per study) |
| `npm run preview` | Preview the production build locally |

---

# How the pieces fit together (the allegory)

Think of your project as a **theatre production**:

- **Vite** = the stage crew
  Vite does two completely different jobs depending on the mode:

## Vite modes

- `npm run dev` — Vite acts as a live rehearsal director. It spins up a local web server, watches your files, and hot-reloads changes instantly. It serves your ES modules natively to the browser without bundling anything. Fast, ephemeral, developer-only.
- `npm run build` — Vite becomes the set builder. It takes all your scripts, CSS, and assets, bundles and minifies them into a `dist/` folder — a self-contained package that can be shipped anywhere (like JATOS). This is where tree-shaking happens: unused code gets trimmed away.

## `base: "./"` in `vite.config.js` = the address on the poster

By default, Vite assumes your app lives at the root of a domain (`/`). But JATOS serves your study from a nested path like `/publix/abc123/`. Setting `base: "./"` makes all asset references relative, so the built files can find each other no matter where they're deployed.

Think of it as printing "Theatre, 3rd door on the left" instead of "123 Main Street" — it works regardless of which building you're in.

## Multi-component architecture = a play in three acts

This template splits the study into three independent components — **consent**, **experiment**, and **debrief** — each with its own root-level HTML entry point (`consent.html`, `experiment.html`, `debrief.html`) and a `src/main.js` inside the corresponding subfolder. Think of them as three separate plays performed in the same theatre on the same night. Each one:

- Loads fresh in the browser (the previous page is completely destroyed)
- Boots up its own jsPsych instance from scratch
- Loads `jatos.js` independently, creating its own `window.jatos`
- Has no knowledge that the other components exist

What ties them together is the **JATOS server**, which orchestrates the sequence behind the scenes. When one component finishes and calls `startNextComponent()`, the browser navigates away from the current page entirely and JATOS serves the next component's HTML. It's like the audience staying seated while the stage crew swaps out the entire set between acts.

The last component uses `endStudy(resultJson)` instead, which tells JATOS the show is over.

### Why split at all?

- **Complete memory reset** between phases — the browser unloads everything and starts fresh, so no accumulation of DOM elements, canvas objects, or event listeners from earlier trials
- **Crash resilience** — if the experiment crashes mid-task, consent data is already safely on the JATOS server
- **Reusability** — the same consent and debrief components can be dropped into any study unchanged

### Why HTML files live at the project root

JATOS serves all components from the same flat URL (e.g. `/publix/abc123/`). If the HTML files were nested inside subdirectories (`consent/index.html`), Vite would write asset paths as `../assets/...`. Because JATOS doesn't reflect subdirectory structure in the URL, those relative paths would resolve incorrectly → 404.

By placing `consent.html`, `experiment.html`, and `debrief.html` at the project root, Vite writes all asset paths as `assets/...` (relative to root), which always resolves correctly regardless of JATOS's URL routing.

### What's shared, what's separate

Shared at the root (installed once, used by all):
- `node_modules/` — all dependencies
- `package.json` and `package-lock.json` — dependency declarations
- `public/assets/` — stimuli and static files (Vite copies these into the build output)
- `styles/common.css` — shared CSS overrides used by consent and debrief
- `vite.config.js` — configured with multiple entry points so one `npm run build` produces all three components
- `functions/global/` — shared JS utilities used across components (e.g. `participantID.js`)

Separate per component:
- `consent.html` / `experiment.html` / `debrief.html` — each component's entry page at the root, pointing to its `src/main.js`
- `<component>/src/main.js` — its own `initJsPsych`, its own `loadJatosScript`, its own timeline
- `experiment/src/style.css` — experiment-specific styling overrides

### The `on_finish` logic per component

Each component's `main.js` has the same JATOS detection and startup boilerplate, but the `on_finish` callback differs:

- **Consent** → `window.jatos.startNextComponent()` (no data saved — consent has no trial data); locally redirects to `/experiment.html`
- **Experiment** → `window.jatos.startNextComponent(resultJson)` (save data, load debrief); locally saves JSON and redirects to `/debrief.html`
- **Debrief** → `window.jatos.endStudy(resultJson)` (save data, end the study); locally saves JSON and shows "Study complete" message

### The `vite.config.js` multi-page setup

Vite is told about all three entry points via `build.rollupOptions.input`. This means `npm run build` produces a `dist/` folder with all three HTML files at the root alongside a shared `assets/` directory.

## HTML entry points = the theatre entrance

Each root-level HTML file (`consent.html` etc.) loads its component's script:

```html
<script type="module" src="./consent/src/main.js"></script>
```

`type="module"` tells the browser "this script uses `import`/`export` syntax." jsPsych automatically creates its own display container inside `<body>` — no target div needed.

The `index.html` at the project root is a dev-only convenience — it immediately redirects to `consent.html` so visiting `localhost:5173/` lands you on the first component. It is not included in the production build.

**Dev server URLs** (after `npm run dev`):
- `http://localhost:5173/` → redirects to consent
- `http://localhost:5173/consent.html`
- `http://localhost:5173/experiment.html`
- `http://localhost:5173/debrief.html`

## `main.js` = the director's script

This is your control flow — it decides what happens in what order.

- The `import` statements at the top are like calling in actors (plugins) from their dressing rooms (`node_modules`).
- The `makeTimeline()` function is your scene list.
- The `start()` function handles the "which theatre are we in?" logic (JATOS vs local).

## `functions/global/participantID.js` = participant stamping

This shared utility stamps every trial row with participant metadata via `jsPsych.data.addProperties()`. It's called inside `jatos.onLoad()` in experiment and debrief. In JATOS it stamps `workerId`, `studyResultId`, and Prolific URL parameters; locally it stamps a random 6-digit fallback ID. Consent does not use it — no trial data is saved from consent.

`studyResultId` is the join key across components: it's the same value in every component for a given participant's run, making it easy to link consent, experiment, and debrief data in analysis.

## `node_modules` = the talent agency

When you ran `npm install`, npm downloaded jsPsych and all its plugins here. You never edit these files. Your import statements pull from here. Vite knows how to resolve `jspsych` → `node_modules/jspsych/...` automatically.

## `package.json` = the contract

It lists what your project depends on (which actors you've hired) and what scripts you can run.

- `dependencies` — packages that become part of your experiment code (jsPsych, plugins)
- `devDependencies` — tools needed only during development (Vite) — the construction crane, not part of the building
- `package-lock.json` pins exact versions so every collaborator gets identical dependencies — it's the fine print on the contract.

### Key scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at localhost:5173 |
| `npm run build` | Bundle to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run init-study` | Generate `study.jas` from `study-config.json` (run once per new study) |
| `npm run build:jatos` | Build + package into `study.jzip` ready for JATOS import |

## Setting up a new study from this template

1. Edit `study-config.json` — set `title`, `dirName`, `description`, `maxParticipants`
2. Run `npm run init-study` — generates `study.jas` with fresh UUIDs, Main + Test batches pre-configured. **This must happen before the first `build:jatos`**, because `build:jatos` reads `dirName` from `study.jas` to name the folder inside the zip.
3. Never run `init-study` again for this study — regenerating UUIDs breaks re-imports into JATOS (it creates a duplicate study instead of updating the existing one)
4. Run `npm run build:jatos` — produces `study.jzip` ready for JATOS import
5. After the first JATOS import, manually configure worker type links in each batch — JATOS creates the batches from `study.jas` but does not fully restore which worker type links are active
6. Use `npm run build:jatos` + re-import for all subsequent deploys — JATOS matches by UUID and updates in place

## `study.jas` and the `.jzip` format

JATOS imports studies as `.jzip` files — a ZIP with a specific structure:

```
study.jzip
├── study.jas                    ← study metadata (JSON)
└── <dirName>/                   ← folder named to match dirName in study.jas
    ├── consent.html
    ├── experiment.html
    ├── debrief.html
    └── assets/
```

`study.jas` contains the study title, component list with HTML file paths, and batch configuration. UUIDs in `study.jas` are permanent database keys — JATOS uses them to match re-imports to existing studies. They are generated once by `npm run init-study` and never changed.

`npm run build:jatos` handles the entire packaging process: builds the project, creates the zip structure using the `dirName` from `study.jas`, and outputs `study.jzip`.

## The JATOS handshake (your `loadJatosScript` pattern)

JATOS injects `jatos.js` at runtime on its own server — it's never in your source code. Your loader creates a `<script>` element, sets its source to `jatos.js`, and appends it to `document.head`. That append triggers the browser to actually fetch the URL:

- **In JATOS**: the fetch succeeds, the script executes, and `window.jatos` is created — a toolkit of functions (`onLoad`, `addAbortButton`, `startNextComponent`, etc.) that let your experiment communicate with the already-running JATOS server.
- **Locally**: the fetch 404s, the script fails silently, and `window.jatos` never appears.

The `inJatos` flag (`typeof window.jatos !== "undefined"`) then lets you branch behavior throughout your code.

Note that `loadJatosScript` resolving only means the JS file was parsed — `jatos.onLoad()` is still needed because JATOS then performs async server communication to populate `workerId`, `studyResultId`, and other IDs. Always gate all `jatos.*` calls (including `data.addProperties`) inside `jatos.onLoad()`.

It's like checking whether you're rehearsing or performing live: if the audience (JATOS) is there, use the real curtain call; if not, just save the recording to disk.

## The browser hierarchy — `window`, `document`, `<head>`, `<body>`

These come up frequently when reading the code, so here's the mental model:

- **`window`** — the entire browser tab. The outermost container for everything: your page, your JavaScript variables, timers, scroll position. When JATOS creates `window.jatos`, it's hanging a sign on the front door of the building.
- **`document`** — the HTML page inside the window. Your HTML file becomes `document` when the browser parses it.
- **`document.head`** (`<head>`) — metadata, scripts, styles. The utility room: important infrastructure, not what users see.
- **`document.body`** (`<body>`) — the visible content area. This is where jsPsych creates its display container.

When a component calls `startNextComponent`, the entire `window` is destroyed and a new one is created for the next component. Nothing persists — which is the whole point.

## Memory leakage — where to watch

In a jsPsych context, the main risks are:

- accumulating large stimuli (images/videos) that never get garbage-collected because references persist in closures or the timeline
- event listeners that aren't cleaned up between trials

jsPsych handles most of this internally, but if you later write custom plugins or use psychophysics with canvas elements, be mindful of cleaning up in the plugin's `on_finish` or `on_load` callbacks.

The preload plugin helps here — it loads assets once up front rather than mid-experiment, giving you a predictable memory footprint.

The multi-component architecture provides an additional safety net: even if memory accumulates during a long experiment phase, it's completely released when the browser navigates to the next component.
