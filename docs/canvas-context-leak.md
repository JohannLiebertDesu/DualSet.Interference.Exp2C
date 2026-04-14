# Canvas Context Leak in jspsych-psychophysics

## The problem

Participants in long experiments (300+ trials) report progressive visual glitches in later blocks: white flashes, blank screens, and erratic flickering that obscures stimuli.

## Root cause

The jspsych-psychophysics plugin creates a new `<canvas>` element for every trial phase (fixation, sample, retention, recall). After each trial, the plugin removes the canvas from the DOM — but multiple JavaScript reference chains prevent the canvas and its 2D rendering context from being garbage-collected.

### Reference chain 1: stim.instance

```
timeline → trial.stimuli[n] → stim.instance → class prototype → closure → ctx → canvas
```

The plugin defines all its stimulus classes (e.g. `circle_stimulus`, `manual_stimulus`, `cross_stimulus`) **inside** its `trial()` method, where they close over the local variable `ctx` (the canvas 2D context). When instantiating stimuli, the plugin sets `.instance` on the original stimulus object: `stim.instance = new set_instance[stim.obj_type](stim)` (plugin source, line ~2178). It never deletes this reference after the trial ends.

### Reference chain 2: trial.context / trial.canvas

```
timeline → resolved trial object → trial.context → ctx → canvas
timeline → resolved trial object → trial.canvas  → canvas
```

The plugin stores direct references to the canvas and its 2D context on the trial parameter object (lines ~2101-2103). These are never cleaned up.

### Reference chain 3: trial.end_trial

```
timeline → resolved trial object → trial.end_trial → closure → ctx, canvas, class definitions
```

The plugin stores its own `end_trial` function on the trial object (line ~2408). This closure captures `ctx`, `canvas`, and all the class definitions.

### Reference chain 4: trial.getColorNum (canvas_for_color)

```
timeline → resolved trial object → trial.getColorNum → closure → canvas_for_color
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
    |   '- timeline array                   <- holds ALL trial objects for entire experiment
    |       |- trial[0] (fixation)
    |       |   |- .stimuli[0].instance -----------.
    |       |   |- .context -------.               |
    |       |   |- .canvas --------|---.           |
    |       |   |- .end_trial -----|---|---.        |
    |       |   '- .getColorNum ---|---|---|---.    |
    |       |                      |   |   |   |   |
    |       |                      v   v   v   |   |
    |       |                    ctx + canvas   |   |  <- main trial canvas (8 MB)
    |       |                                   v   |
    |       |                        canvas_for_color  <- utility canvas (192 KB)
    |       |                                       |
    |       |                                       v
    |       |                          class instance → prototype → closure → ctx
    |       |
    |       |- trial[1] (sample) ... same pattern
    |       |- trial[2] (retention) ... same pattern
    |       |- trial[3] (recall) ... same pattern
    |       '- ... (~1,320 trial objects, each retaining 2 canvases)
    |
    '- detached canvases                    <- NOT in the DOM, but alive in memory
        |- ~1,320 main canvases (8 MB each)
        |- ~1,320 canvas_for_color (192 KB each)
        '- total: ~11 GB of pixel buffers retained

    The garbage collector cannot free these canvases because multiple
    reference chains from the timeline keep them reachable.
```

## Why most experiments don't hit this

- Experiments using `timeline_variables` reuse the same stimulus objects across repetitions. Each run of the trial overwrites `stim.instance` on the same object, so only one context is retained per stimulus object.
- Experiments with <100 canvas-based trials stay within browser context limits.
- Our experiment creates unique stimulus objects per trial (randomized positions, features, response wheels), resulting in ~1,320 unique objects that each accumulate retained contexts.

## Evidence

- 3 participants reported progressive visual glitches (white flashes, blank screens) worsening in blocks 6-7.
- Safari's Graphics tab showed 400+ live canvases in memory after just 1 block (40 trials x 4 phases + practice).
- FinalizationRegistry test confirmed: out of 41 canvases created, only 1 was garbage-collected (97% retention rate).
- After the fix: canvases appear and disappear correctly in the Graphics tab, no accumulation.

## Fix

Implemented in `experiment/src/main.js` via `on_trial_start` / `on_trial_finish` callbacks in `initJsPsych`.

**Why this location:** the plugin sets its references on the *resolved* trial object (a copy jsPsych creates internally), not on the original trial object in the timeline. `jsPsych.getCurrentTrial()` returns the original, so it can't be used for cleanup. Instead, `on_trial_start(trial)` receives the resolved object directly — we capture it there and clean it up in `on_trial_finish`.

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
