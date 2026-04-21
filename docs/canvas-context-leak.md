# Canvas Context Leak in jspsych-psychophysics

## The problem

Participants in long experiments (300+ trials) report progressive visual glitches in later blocks: white flashes, blank screens, and erratic flickering that obscures stimuli.

## Root cause

The leak only exists because **two independent design choices interact badly** — neither would be a problem alone.

1. **jspsych-psychophysics mutates the trial object.** The plugin writes live rendering handles back onto the trial parameters it receives (`trial.canvas`, `trial.context`, `trial.end_trial`, `trial.getColorNum`, `stim.instance`). This is how the plugin exposes its public API to experimenter-supplied callbacks like `stepFunc` or `mouse_down_func`.

2. **jsPsych 8 retains the mutated object for the whole session.** In jsPsych 7, the object passed to the plugin was a throwaway deep copy (returned from `TimelineNode.trial()` and caught briefly by `JsPsych.current_trial`). It became unreachable the moment the next trial started, so any plugin mutations were GC'd with it. In jsPsych 8, the deep copy is stored as a field on a `Trial` class instance that sits in `Timeline.children[]` for the entire experiment.

See `node_modules/jspsych/src/timeline/Trial.ts:36` (v8) vs `node_modules/jspsych/src/TimelineNode.ts:119` (v7) for the architectural shift: the `deepCopy(description)` call that used to be a return value became a persistent field.

The consequence: the jspsych-psychophysics plugin creates a new `<canvas>` element for every trial phase (fixation, sample, retention, recall) and, after each trial, removes the canvas from the DOM — but the JavaScript reference chains it sets on the trial object are now permanently rooted in `Timeline.children[].trialObject`, so the canvas and its 2D rendering context can never be garbage-collected.

Each reference chain below assumes the v8 retention mechanism described above — in v7, every one of these chains would terminate one trial later when the throwaway trial copy fell out of scope.

### Reference chain 1: stim.instance

```
Timeline.children[i].trialObject → trial.stimuli[n] → stim.instance → class prototype → closure → ctx → canvas
```

The plugin defines all its stimulus classes (e.g. `circle_stimulus`, `manual_stimulus`, `cross_stimulus`) **inside** its `trial()` method, where they close over the local variable `ctx` (the canvas 2D context). When instantiating stimuli, the plugin sets `.instance` on the original stimulus object: `stim.instance = new set_instance[stim.obj_type](stim)` (plugin source, line ~2178). It never deletes this reference after the trial ends.

### Reference chain 2: trial.context / trial.canvas

```
Timeline.children[i].trialObject → trial.context → ctx → canvas
Timeline.children[i].trialObject → trial.canvas  → canvas
```

The plugin stores direct references to the canvas and its 2D context on the trial parameter object (lines ~2101-2103). These are never cleaned up.

### Reference chain 3: trial.end_trial

```
Timeline.children[i].trialObject → trial.end_trial → closure → ctx, canvas, class definitions
```

The plugin stores its own `end_trial` function on the trial object (line ~2408). This closure captures `ctx`, `canvas`, and all the class definitions.

### Reference chain 4: trial.getColorNum (canvas_for_color)

```
Timeline.children[i].trialObject → trial.getColorNum → closure → canvas_for_color
```

The plugin creates a hidden 300x150 utility canvas (`canvas_for_color`) inside each `trial()` call for color conversion (line ~552). The `getColorNum` function that closes over it is stored on the trial object (line ~565).

### Result

Each trial phase retains **2 canvases**: the main trial canvas (full screen resolution, ~8 MB each) and the utility `canvas_for_color` (300x150, ~192 KB each). Over ~1,200 trial phases this exhausts the browser's canvas memory, causing progressive rendering glitches.

## Where this lives in the browser

```
window                                      <- the entire browser tab
|
|- document (the DOM)                       <- the tree of HTML elements
|   |- document.head (<head>)               <- metadata, scripts, styles
|   '- document.body (<body>)               <- visible content
|       '- #jspsych-display-element         <- jsPsych's auto-created wrapper
|           '- #jspsych-content
|               '- <canvas id="myCanvas">   <- CURRENT trial's canvas (only 1 at a time)
|                                              removed by the plugin via innerHTML = ""
|                                              after each trial ends
|
'- JavaScript heap (memory)                 <- where JS objects live, managed by GC
    |
    |- jsPsych instance
    |   '- Timeline (root)
    |       '- children[]                   <- v8: every Trial instance retained here for the session
    |           |- Trial[0] (fixation)
    |           |   '- trialObject          <- deepCopy the plugin mutates; persists as a FIELD
    |           |       |- .stimuli[0].instance -----.
    |           |       |- .context -------.         |
    |           |       |- .canvas --------|---.     |
    |           |       |- .end_trial -----|---|-.    |
    |           |       '- .getColorNum ---|---|-|-.  |
    |           |                          |   | | |  |
    |           |                          v   v | |  |
    |           |                        ctx + canvas |  <- main trial canvas (8 MB)
    |           |                                   v |
    |           |                      canvas_for_color  <- utility canvas (192 KB)
    |           |                                     |
    |           |                                     v
    |           |                        class instance → prototype → closure → ctx
    |           |
    |           |- Trial[1] (sample) ... same pattern
    |           |- Trial[2] (retention) ... same pattern
    |           |- Trial[3] (recall) ... same pattern
    |           '- ... (~1,320 Trial instances, each retaining 2 canvases via trialObject)
    |
    '- detached canvases                    <- NOT in the DOM, but alive in memory
        |- ~1,320 main canvases (8 MB each)
        |- ~1,320 canvas_for_color (192 KB each)
        '- total: ~11 GB of pixel buffers retained

    The garbage collector cannot free these canvases because Timeline.children[]
    holds every Trial instance, and each instance's .trialObject field is the
    root of the reference chains the plugin set up.

    In jsPsych 7 this tree stored only the pristine trial description; the
    mutable copy handed to the plugin was a throwaway return value. In jsPsych 8
    the mutable copy IS the stored field. Same plugin behavior, opposite outcome.
```

## Why most experiments don't hit this

- **jsPsych 7 users never see it.** In v7 the trial object the plugin mutates was a throwaway, so every reference chain died one trial later. An experiment identical to ours, but running on `jspsych@^7`, would leak nothing — which is why most published demos (including the `shape_judgement_task` reference project pinned to v7.3.1 + psychophysics 3.6.0) appear clean even under the same plugin behavior.
- **Short v8 experiments stay under the canvas budget.** Experiments with fewer than ~100 canvas-based trial phases stay within the browser's live-canvas limit before the session ends, so the leak never manifests as visible glitches.
- **Experiments using `timeline_variables` have a smaller footprint.** They reuse the same stimulus objects across repetitions, so each run overwrites `stim.instance` on the same object and only one context is retained per stimulus object (still a leak, just smaller).
- **Our experiment is the worst case.** v8 + psychophysics + unique stimulus objects per trial (randomized positions, features, response wheels) → ~1,320 unique objects, each rooted in `Timeline.children[]`, each pinning two canvases.

## Evidence

- 3 participants reported progressive visual glitches (white flashes, blank screens) worsening in blocks 6-7.
- Safari's Graphics tab showed 400+ live canvases in memory after just 1 block (40 trials x 4 phases + practice).
- FinalizationRegistry test confirmed: out of 41 canvases created, only 1 was garbage-collected (97% retention rate).
- After the fix: canvases appear and disappear correctly in the Graphics tab, no accumulation.

## Fix

Implemented in `experiment/src/main.js` via `on_trial_start` / `on_trial_finish` callbacks in `initJsPsych`.

**Why this location:** the plugin mutates `Trial.trialObject` — the deepCopy jsPsych 8 stores on the Trial instance (`Trial.ts:36`). That is the object we need to prune, because Timeline.children[] keeps the Trial instance (and thus its `trialObject` field) alive for the whole session. `on_trial_start(trial)` receives exactly this object (jsPsych passes `this.trialObject` into the callback), so we capture it there and strip the plugin's additions in `on_trial_finish` before they compound.

Note that deleting these fields does *not* break the trial that just ran — by `on_trial_finish` time, the plugin has already called `finishTrial(data)` and the data has been written. The only role of these fields at that point is to keep the canvas chains alive, which is exactly what we want to sever.

```js
on_trial_start: (trial) => {
  // Capture the resolved trial object for psychophysics trials.
  // This is the same object the plugin's trial() method will modify.
  if (trial.type === jsPsychPsychophysics) {
    jsPsych._lastPsychTrial = trial;
  } else {
    jsPsych._lastPsychTrial = null;
  }
},
on_trial_finish: () => {
  const trial = jsPsych._lastPsychTrial;
  if (!trial) return;
  jsPsych._lastPsychTrial = null;

  // 1. Break stim.instance chain
  if (Array.isArray(trial.stimuli)) {
    for (const stim of trial.stimuli) delete stim.instance;
  }
  // 2. Break direct references the plugin sets on the trial object
  delete trial.context;
  delete trial.canvas;
  delete trial.end_trial;
  delete trial.getColorNum;
  delete trial.centerX;
  delete trial.centerY;
},
```

Note: stimulus arrays passed as functions (e.g. the sample phase's `stimuli: () => [...]`) create objects fresh each trial. These are part of the resolved trial object and are cleaned up by the `trial.stimuli` iteration above.

## Debugging

To verify the fix is working, use Safari's Web Inspector:

- **Graphics tab**: should show only 1-2 canvases at any time, with old canvases disappearing between trials.
- **FinalizationRegistry** (paste into console before starting):
  ```js
  window.__created = 0;
  window.__collected = 0;
  window.__reg = new FinalizationRegistry(() => window.__collected++);
  const _orig = document.createElement.bind(document);
  document.createElement = function(tag, opts) {
    const el = _orig(tag, opts);
    if (tag.toLowerCase() === 'canvas') { window.__created++; window.__reg.register(el); }
    return el;
  };
  ```
  Then at any break:
  ```js
  `Created: ${__created}, GC'd: ${__collected}, Retained: ${__created - __collected}`
  ```
  With the fix, `Retained` should stay low. Without it, it climbs linearly.
