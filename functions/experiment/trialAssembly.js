/**
 * Single-trial assembly — converts a trial spec into a sequence of jsPsych
 * trial objects representing the temporal phases of one logical trial:
 *
 *   1. Pre-trial blank — 1000 ms; separates this trial from the previous
 *                        probe response so the sample display doesn't appear
 *                        the instant the participant clicks.
 *   2. Sample phase(s) — triangles on a blank canvas. 200 ms per item.
 *                        Combined: 1 sample phase with all items.
 *                        Split:    2 sample phases (left then right),
 *                                  separated by a 1000 ms blank ISI.
 *   3. Retention       — blank canvas, condition-dependent (see
 *                        Settings.timing.retentionMs).
 *   4. Probe 1         — orientation wheel at tested_first item's position.
 *                        Two-click protocol (first click reveals preview,
 *                        second click confirms).
 *   5. Inter-probe ISI — blank canvas, 100 ms (matches Exp2B's post_trial_gap).
 *   6. Probe 2         — orientation wheel at tested_second item's position.
 *                        Same protocol as probe 1.
 *
 * No fixation cross and no per-trial feedback — Exp2B had neither, and this
 * replication follows the same convention.
 *
 * Positions are grid-assigned once per trial via assignPositions(); the same
 * per-item {x, y} is reused across sample + probe phases so the wheel sits
 * exactly where its item appeared.
 */

import { Settings } from "../../ExperimentSettings.js";
import { makePsychophysicsTrial } from "./trialRendering.js";
import {
  assignPositions,
  getStimulusRadius,
  getTriangleDimensions,
} from "./gridPositioning.js";
import { makeOrientedTriangleStimulus } from "./stimuli.js";
import { createOrientationWheel, signedAngleDiff } from "./responseWheel.js";

const {
  preTrialBlankMs,
  sampleDurationPerItemMs,
  splitISIMs,
  retentionMs,
  interProbeISIMs,
} = Settings.timing;

/**
 * Retention duration in ms, keyed by trial condition.
 * Combined-3 > Combined-6 > Split so that total (sample + retention) window
 * stays constant at 3200 ms across all three conditions. See ExperimentSettings.
 */
function retentionForSpec(spec) {
  if (spec.blockType === "Split") return retentionMs.split;
  return spec.numItems === 3 ? retentionMs.combined3 : retentionMs.combined6;
}

// ── Helpers ──────────────────────────────────────────────────────────────

/** Build triangle stimuli at a list of item positions. */
function buildTriangles(items, positions, dims) {
  return items.map((item, i) =>
    makeOrientedTriangleStimulus(
      positions[i].x,
      positions[i].y,
      item.orientationDeg,
      { base: dims.base, height: dims.height }
    )
  );
}

// Invisible-probe fill matches the trial background so the probe's
// appearance is hidden until the participant's first click.
function makeInvisibleTriangle(x, y, dims) {
  return makeOrientedTriangleStimulus(x, y, 0, {
    base: dims.base,
    height: dims.height,
    lightness: Settings.display.backgroundLightness,
  });
}

// ── Recall-phase factory ─────────────────────────────────────────────────

/**
 * Build a single recall (probe) phase.
 *
 * Practice and main trials are structurally identical — Exp2B gave no
 * per-trial feedback, so neither does this replication.
 *
 * @param {object} args
 * @param {number} args.trialID
 * @param {number} args.blockID
 * @param {boolean} args.practice
 * @param {number} args.probeIndex           Which item (0-based) is being probed.
 * @param {object} args.probePos             {x, y} of that item.
 * @param {number} args.probeOrientation     Target orientation in degrees.
 * @param {"tested_first"|"tested_second"} args.probeLabel
 * @param {object} args.trialData            Payload merged into this probe's data row.
 * @param {object} args.triangleDims         {base, height} for the invisible probe triangle.
 * @param {object} args.jsPsych
 * @returns {object[]}  Array containing the single recall trial.
 */
function makeRecallPhase({
  trialID,
  blockID,
  practice,
  probeIndex,
  probePos,
  probeOrientation,
  probeLabel,
  trialData,
  triangleDims,
  jsPsych,
}) {
  const radius = getStimulusRadius();
  const outerRadius = radius * Settings.responseWheel.outerRadiusFactor;
  const innerRadius = radius * Settings.responseWheel.innerRadiusFactor;
  const { lightness } = Settings.stimuli;

  const wheel = createOrientationWheel(probePos.x, probePos.y, { outerRadius, innerRadius });
  const probe = makeInvisibleTriangle(probePos.x, probePos.y, triangleDims);

  let isActive = false;
  let selectedAngle;
  let firstClickAngle;
  let firstClickTime = null;
  let trialStartTime = null;

  function updateProbeFromMouse(e) {
    const live = jsPsych.getCurrentTrial().stimuli[1].instance;
    const dx = e.offsetX - live.currentX;
    const dy = e.offsetY - live.currentY;
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;

    selectedAngle = deg;
    live.fill_color = `oklch(${lightness} 0 0)`;
    live.line_color = `oklch(${lightness} 0 0)`;
    live.orientationDeg = deg;
  }

  const recall = makePsychophysicsTrial({
    trialID,
    blockID,
    practice,
    response_type: "key",
    choices: ["F24"],
    stimuli: [wheel, probe],
    on_start: () => {
      document.body.style.cursor = "default";
      trialStartTime = performance.now();
    },

    mouse_down_func: (e) => {
      if (!isActive) {
        isActive = true;
        firstClickTime = performance.now();
        updateProbeFromMouse(e);
        firstClickAngle = selectedAngle;
      } else {
        document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "F24" }));
        document.body.dispatchEvent(new KeyboardEvent("keyup", { key: "F24" }));
      }
    },

    mouse_move_func: (e) => {
      if (!isActive) return;
      updateProbeFromMouse(e);
    },

    on_finish: (data) => {
      data.selectedAngle = selectedAngle;
      data.signedError = selectedAngle != null
        ? signedAngleDiff(selectedAngle, probeOrientation)
        : null;
      data.absoluteError = data.signedError != null ? Math.abs(data.signedError) : null;
      data.firstClickAngle = firstClickAngle;
      data.firstClickSignedError = firstClickAngle != null
        ? signedAngleDiff(firstClickAngle, probeOrientation)
        : null;
      data.firstClickAbsoluteError = data.firstClickSignedError != null
        ? Math.abs(data.firstClickSignedError)
        : null;
      data.firstClickRt = firstClickTime && trialStartTime
        ? firstClickTime - trialStartTime
        : null;
    },

    data: {
      ...trialData,
      phase: "recall",
      probeLabel,
      probeIndex,
      probeOrientation,
    },
  });

  return [recall];
}

// ── Full trial assembly ──────────────────────────────────────────────────

/**
 * Turn a single-trial spec into a sequence of jsPsych trial objects.
 *
 * @param {object} spec       Output of generateTrial().
 * @param {number} trialID    Unique trial number.
 * @param {number} blockID    Block this trial belongs to (1-indexed; 0 = practice).
 * @param {boolean} practice
 * @param {object} jsPsych
 * @returns {object[]} jsPsych trial objects for this logical trial.
 */
export function assembleTrialSequence(spec, trialID, blockID, practice, jsPsych) {
  // Positions are picked once up front so sample and probe phases share them.
  const positions = assignPositions(spec.items.map((it) => it.side));

  // Triangle size derived from the same grid cell as positions, so all
  // triangles in this trial (sample + probe) match in scale. Area equals
  // f · π·r² where r is the Exp2B stimulus radius and f is
  // Settings.stimuli.triangleAreaFraction — see gridPositioning.js.
  const triangleDims = getTriangleDimensions();

  const sampleDuration = sampleDurationPerItemMs * spec.numItems;
  // Combined: all items shown at once for 200 ms × numItems.
  // Split: 3 items per screen for 200 ms × 3 = 600 ms, twice.
  const splitHalfDuration = sampleDurationPerItemMs * 3;

  // Per-trial data stamped on probe rows (trial-level context for analysis).
  const trialData = {
    blockType: spec.blockType,
    numItems: spec.numItems,
    sampleDurationTotal: spec.blockType === "Split"
      ? splitHalfDuration * 2 + splitISIMs
      : sampleDuration,
    items: spec.items,
    positions,
    probe1Index: spec.probe1Index,
    probe2Index: spec.probe2Index,
  };

  const sequence = [];

  // Hide the system cursor until probe 1 brings it back.
  const hideCursor = () => {
    document.body.style.cursor = "none";
  };

  // 1. Pre-trial blank — buffer between the previous probe response and this
  //    trial's sample display. Also hides the cursor for the rest of the trial.
  sequence.push(
    makePsychophysicsTrial({
      trialID,
      blockID,
      practice,
      choices: "NO_KEYS",
      trial_duration: preTrialBlankMs,
      stimuli: [],
      on_start: hideCursor,
      data: { phase: "pre_trial_blank" },
    })
  );

  // 2. Sample phase(s)
  if (spec.blockType === "Combined") {
    sequence.push(
      makePsychophysicsTrial({
        trialID,
        blockID,
        practice,
        choices: "NO_KEYS",
        trial_duration: sampleDuration,
        stimuli: () => buildTriangles(spec.items, positions, triangleDims),
        on_start: hideCursor,
        data: { phase: "sample", samplePart: 1 },
      })
    );
  } else {
    // Split: 3 left → 1000 ms blank ISI → 3 right
    const leftItems = spec.items.slice(0, 3);
    const leftPositions = positions.slice(0, 3);
    const rightItems = spec.items.slice(3, 6);
    const rightPositions = positions.slice(3, 6);

    sequence.push(
      makePsychophysicsTrial({
        trialID,
        blockID,
        practice,
        choices: "NO_KEYS",
        trial_duration: splitHalfDuration,
        stimuli: () => buildTriangles(leftItems, leftPositions, triangleDims),
        on_start: hideCursor,
        data: { phase: "sample", samplePart: 1 },
      })
    );

    sequence.push(
      makePsychophysicsTrial({
        trialID,
        blockID,
        practice,
        choices: "NO_KEYS",
        trial_duration: splitISIMs,
        stimuli: [],
        data: { phase: "split_isi" },
      })
    );

    sequence.push(
      makePsychophysicsTrial({
        trialID,
        blockID,
        practice,
        choices: "NO_KEYS",
        trial_duration: splitHalfDuration,
        stimuli: () => buildTriangles(rightItems, rightPositions, triangleDims),
        data: { phase: "sample", samplePart: 2 },
      })
    );
  }

  // 3. Retention (blank) — duration varies by condition so that the total
  //    (sample + retention) window stays constant at 3200 ms.
  const retentionDuration = retentionForSpec(spec);
  sequence.push(
    makePsychophysicsTrial({
      trialID,
      blockID,
      practice,
      choices: "NO_KEYS",
      trial_duration: retentionDuration,
      stimuli: [],
      data: { phase: "retention", retentionDuration },
    })
  );

  // 4. Probe 1 — cursor returns to default inside makeRecallPhase
  sequence.push(
    ...makeRecallPhase({
      trialID,
      blockID,
      practice,
      probeIndex: spec.probe1Index,
      probePos: positions[spec.probe1Index],
      probeOrientation: spec.items[spec.probe1Index].orientationDeg,
      probeLabel: "tested_first",
      trialData,
      triangleDims,
      jsPsych,
    })
  );

  // 5. Inter-probe ISI (blank)
  sequence.push(
    makePsychophysicsTrial({
      trialID,
      blockID,
      practice,
      choices: "NO_KEYS",
      trial_duration: interProbeISIMs,
      stimuli: [],
      on_start: hideCursor,
      data: { phase: "inter_probe_isi" },
    })
  );

  // 6. Probe 2
  sequence.push(
    ...makeRecallPhase({
      trialID,
      blockID,
      practice,
      probeIndex: spec.probe2Index,
      probePos: positions[spec.probe2Index],
      probeOrientation: spec.items[spec.probe2Index].orientationDeg,
      probeLabel: "tested_second",
      trialData,
      triangleDims,
      jsPsych,
    })
  );

  return sequence;
}
