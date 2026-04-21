/**
 * Single-trial assembly — converts a trial spec into a sequence of jsPsych
 * trial objects representing the temporal phases of one logical trial:
 *
 *   1. Sample phase(s) — triangles on a blank canvas. 200 ms per item.
 *                        Combined: 1 sample phase with all items.
 *                        Split:    2 sample phases (left then right),
 *                                  separated by a 1000 ms blank ISI.
 *   2. Retention       — blank canvas, 1000 ms
 *   3. Probe 1         — orientation wheel at tested_first item's position.
 *                        Two-click protocol (first click reveals preview,
 *                        second click confirms). (+ feedback if practice.)
 *   4. Inter-probe ISI — blank canvas, 100 ms (matches Exp2B's post_trial_gap).
 *   5. Probe 2         — orientation wheel at tested_second item's position.
 *                        Same protocol as probe 1.       (+ feedback if practice.)
 *
 * No fixation cross anywhere — Exp2B did not use one, and this replication
 * follows the same convention.
 *
 * Positions are grid-assigned once per trial via assignPositions(); the same
 * per-item {x, y} is reused across sample + probe phases so the wheel sits
 * exactly where its item appeared.
 */

import { Settings } from "../../ExperimentSettings.js";
import { makePsychophysicsTrial } from "./trialRendering.js";
import { assignPositions, getStimulusRadius } from "./gridPositioning.js";
import { makeOrientedTriangleStimulus } from "./stimuli.js";
import { createOrientationWheel, signedAngleDiff } from "./responseWheel.js";

const {
  sampleDurationPerItemMs,
  splitISIMs,
  retentionDurationMs,
  interProbeISIMs,
} = Settings.timing;

// ── Helpers ──────────────────────────────────────────────────────────────

/** Build triangle stimuli at a list of item positions. */
function buildTriangles(items, positions) {
  return items.map((item, i) =>
    makeOrientedTriangleStimulus(positions[i].x, positions[i].y, item.orientationDeg)
  );
}

// Invisible-probe neutral-grey matches the trial background so the probe
// appearance is hidden until the participant's first click.
function makeInvisibleTriangle(x, y) {
  return makeOrientedTriangleStimulus(x, y, 0, {
    lightness: Settings.display.backgroundLightness,
  });
}

// ── Recall-phase factory ─────────────────────────────────────────────────

/**
 * Build a single recall (probe) phase plus (optionally) a feedback phase.
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
 * @param {object} args.jsPsych
 * @returns {object[]}  [recallTrial] or [recallTrial, feedbackTrial] when practice.
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
  jsPsych,
}) {
  const radius = getStimulusRadius();
  const outerRadius = radius * Settings.responseWheel.outerRadiusFactor;
  const innerRadius = radius * Settings.responseWheel.innerRadiusFactor;
  const { lightness } = Settings.stimuli;

  const wheel = createOrientationWheel(probePos.x, probePos.y, { outerRadius, innerRadius });
  const probe = makeInvisibleTriangle(probePos.x, probePos.y);
  const cross = makeFixationCross();

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
    stimuli: [wheel, probe, cross],
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

  if (!practice) return [recall];

  // ── Feedback (practice only) ──────────────────────────────────────────
  const correctScreenAngle = (probeOrientation * Math.PI) / 180;
  const frozenProbe = makeInvisibleTriangle(probePos.x, probePos.y);
  const feedbackWheel = createOrientationWheel(probePos.x, probePos.y, { outerRadius, innerRadius });

  const correctMarker = {
    obj_type: "manual",
    origin_center: false,
    startX: probePos.x,
    startY: probePos.y,
    drawFunc: (stimulus, canvas, ctx) => {
      const cx = stimulus.currentX;
      const cy = stimulus.currentY;
      const markerRadius = (outerRadius + innerRadius) / 2;
      const mx = cx + markerRadius * Math.cos(correctScreenAngle);
      const my = cy + markerRadius * Math.sin(correctScreenAngle);

      ctx.beginPath();
      ctx.arc(mx, my, 6, 0, 2 * Math.PI);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.strokeStyle = "black";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
  };

  const feedback = makePsychophysicsTrial({
    trialID,
    blockID,
    practice: true,
    choices: "NO_KEYS",
    trial_duration: 1500,
    stimuli: [feedbackWheel, frozenProbe, correctMarker],

    on_start: () => {
      const absError = selectedAngle != null
        ? Math.abs(signedAngleDiff(selectedAngle, probeOrientation))
        : 180;
      let smileyPath;
      if (absError < 30) smileyPath = "assets/happy.svg";
      else if (absError < 55) smileyPath = "assets/medium.svg";
      else smileyPath = "assets/sad.svg";

      const img = document.createElement("img");
      img.src = smileyPath;
      img.id = "feedback-smiley";
      img.style.cssText = "position:fixed; top:10%; left:50%; transform:translateX(-50%); height:8vh; z-index:1000;";
      document.body.appendChild(img);
    },

    on_load: () => {
      const live = jsPsych.getCurrentTrial().stimuli[1].instance;
      if (selectedAngle !== undefined) {
        live.fill_color = `oklch(${lightness} 0 0)`;
        live.line_color = `oklch(${lightness} 0 0)`;
        live.orientationDeg = selectedAngle;
      }
    },

    on_finish: () => {
      const smiley = document.getElementById("feedback-smiley");
      if (smiley) smiley.remove();
    },

    data: { phase: "feedback", probeLabel, probeIndex },
  });

  return [recall, feedback];
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

  const sampleDuration = sampleDurationPerItemMs * spec.numItems;
  // Combined: all items shown at once for 200 ms × numItems.
  // Split: 3 items per screen for 200 ms × 3 = 600 ms, twice.
  const splitHalfDuration = sampleDurationPerItemMs * 3;

  // Per-trial data stamped on probe rows (trial-level context for analysis).
  const trialData = {
    blockType: spec.blockType,
    presentationOrder: spec.presentationOrder,
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

  // 1. Sample phase(s)
  if (spec.blockType === "Combined") {
    sequence.push(
      makePsychophysicsTrial({
        trialID,
        blockID,
        practice,
        choices: "NO_KEYS",
        trial_duration: sampleDuration,
        stimuli: () => buildTriangles(spec.items, positions),
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
        stimuli: () => buildTriangles(leftItems, leftPositions),
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
        stimuli: () => buildTriangles(rightItems, rightPositions),
        data: { phase: "sample", samplePart: 2 },
      })
    );
  }

  // 2. Retention (blank)
  sequence.push(
    makePsychophysicsTrial({
      trialID,
      blockID,
      practice,
      choices: "NO_KEYS",
      trial_duration: retentionDurationMs,
      stimuli: [],
      data: { phase: "retention" },
    })
  );

  // 3. Probe 1 (+ feedback if practice) — cursor returns to default inside makeRecallPhase
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
      jsPsych,
    })
  );

  // 4. Inter-probe ISI (blank)
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

  // 5. Probe 2 (+ feedback if practice)
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
      jsPsych,
    })
  );

  return sequence;
}
