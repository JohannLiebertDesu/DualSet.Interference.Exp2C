# Canvas Context Leak in jspsych-psychophysics

## The problem

Participants in long experiments (300+ trials) report progressive visual glitches in later blocks: white flashes, blank screens, and erratic flickering that obscures stimuli.

## Root cause

The jspsych-psychophysics plugin creates a new `<canvas>` element for every trial phase (fixation, sample, retention, recall). After each trial, the plugin removes the canvas from the DOM — but a JavaScript reference chain prevents the canvas and its 2D rendering context from being garbage-collected.

The reference chain:

```
timeline → trial.stimuli[n] → stim.instance → class prototype → closure → ctx → canvas
```

Specifically:

1. The plugin defines all its stimulus classes (e.g. `circle_stimulus`, `manual_stimulus`, `cross_stimulus`) **inside** its `trial()` method, where they close over the local variable `ctx` (the canvas 2D context).
2. When instantiating stimuli, the plugin sets `.instance` on the original stimulus object you passed in: `stim.instance = new set_instance[stim.obj_type](stim)` (plugin source, line ~2178).
3. After the trial ends, the plugin removes the `<canvas>` from the DOM via `display_element.innerHTML = ""`, but it **never** deletes `stim.instance`.
4. Since the stimulus objects are held in the timeline (which jsPsych retains for the entire experiment), `stim.instance` keeps the class instance alive, which keeps the class prototype alive, which keeps the `trial()` closure alive, which keeps `ctx` alive, which keeps the detached canvas alive.

Each retained canvas holds a full-resolution pixel buffer in memory. Browsers cap active 2D contexts (Safari ~64, Chrome ~128). When the cap is exceeded, the browser evicts the oldest contexts, which can cause rendering glitches on the current trial's canvas.

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
    |       |   '- .stimuli: [crossObj]
    |       |       '- crossObj.instance ------------.
    |       |- trial[1] (sample)                     |
    |       |   '- .stimuli: [item1, item2, cross]   |
    |       |- trial[2] (retention)                  |
    |       |   '- .stimuli: [crossObj]              |
    |       |       '- crossObj.instance --------.   |
    |       |- trial[3] (recall)                 |   |
    |       |   '- .stimuli: [wheel, probe, cross]   |
    |       |       '- wheel.instance -------.   |   |
    |       '- ... (1,320 trial objects)     |   |   |
    |                                        |   |   |
    |                                        v   v   v
    |- stimulus instances (classes defined inside trial())
    |   |- instance_A --- closes over ctx_A --> canvas_A (detached from DOM)
    |   |- instance_B --- closes over ctx_B --> canvas_B (detached from DOM)
    |   |- instance_C --- closes over ctx_C --> canvas_C (detached from DOM)
    |   '- ... (400+ after block 1, ~2,800+ by block 7)
    |
    '- detached canvases                    <- NOT in the DOM, but alive in memory
        |- canvas_A + ctx_A + pixel buffer    because stim.instance holds a reference
        |- canvas_B + ctx_B + pixel buffer    chain that prevents garbage collection
        |- canvas_C + ctx_C + pixel buffer
        '- ...

    The garbage collector cannot free these canvases because the reference chain
    from timeline -> stim.instance is never broken.

    Deleting stim.instance after each trial severs the chain and allows GC.
```

## Why most experiments don't hit this

- Experiments using `timeline_variables` reuse the same stimulus objects across repetitions. Each run of the trial overwrites `stim.instance` on the same object, so only one context is retained per stimulus object.
- Experiments with <100 canvas-based trials stay within browser context limits.
- Our experiment creates unique stimulus objects per trial (randomized positions, features, response wheels), resulting in ~1,320 unique objects that each accumulate a retained context.

## Evidence

- 3 participants reported progressive visual glitches (white flashes, blank screens) worsening in blocks 6-7.
- Safari's Graphics tab showed 400+ live canvases in memory after just 1 block (40 trials x 4 phases + practice).
- The experiment runs flawlessly in dev mode (ruling out all non-JATOS causes), and the visual glitches are independent of the JATOS crash investigated separately.

## Fix

Delete `stim.instance` in `on_finish` of every psychophysics trial to sever the reference chain. This is implemented in `makePsychophysicsTrial` in `trialRendering.js` — see the `on_finish` wrapper that cleans up after the caller's `on_finish` runs.

Note: for stimulus arrays passed as functions (e.g. the sample phase's `stimuli: () => [...]`), the objects are created fresh each trial and become unreachable after it ends — these are safe from the leak. Only statically-defined stimulus arrays (fixation, retention, recall) need cleanup.
