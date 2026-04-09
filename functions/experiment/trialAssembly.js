/**
 * Single-trial assembly — converts a trial spec into a sequence of
 * jsPsych trial objects representing the temporal phases of one trial:
 *
 *   1. Fixation    — fixation cross only, 500 ms
 *   2. Sample      — stimuli + fixation cross, 150 ms × totalItems
 *   3. Retention   — fixation cross only, 1000 ms
 *   4. Recall      — response wheel + invisible probe at the probed item's
 *                     position. Two-click protocol: first click reveals the
 *                     probe and starts tracking the mouse angle; second click
 *                     confirms the response and ends the trial.
 *
 * The recall phase uses the wheel and probe as separate psychophysics stimuli.
 * The probe starts invisible (matching the background). On first click, the
 * mouse handler sets the probe's mutable properties (fill_color, line_color,
 * orientationDeg) directly on the live stimulus instance — the plugin re-reads
 * these each frame, so changes appear immediately.
 *
 * jsPsych instance is passed through the chain so mouse handlers can access
 * live stimulus instances via jsPsych.getCurrentTrial().stimuli[n].instance.
 */

import { Settings } from "../../ExperimentSettings.js";
import { makePsychophysicsTrial } from "./trialRendering.js";
import { getRingPositions } from "./ringPositions.js";
import { makeOrientedTriangleStimulus, makeColorPatchStimulus, makeFixationCross } from "./stimuli.js";
import { createColorWheel, createOrientationWheel, signedAngleDiff } from "./responseWheel.js";

const { fixationDurationMs, sampleDurationPerItemMs, retentionDurationMs } = Settings.timing;

// ── Stimulus builder ─────────────────────────────────────────────────────

/**
 * Convert a trial spec's items array into psychophysics stimulus objects
 * placed on the invisible ring.
 *
 * @param {object[]} items       Items from generateTrial (each has .dimension and .featureValue).
 * @param {object[]} positions   Pre-computed ring positions (from getRingPositions).
 * @returns {object[]} Array of psychophysics stimulus objects.
 */
function buildStimuliFromSpec(items, positions) {
  return items.map((item, i) => {
    if (item.dimension === "orientation") {
      return makeOrientedTriangleStimulus(positions[i].x, positions[i].y, item.featureValue);
    } else {
      return makeColorPatchStimulus(positions[i].x, positions[i].y, item.featureValue);
    }
  });
}

// ── Trial sequence ───────────────────────────────────────────────────────

/**
 * Assemble a single trial spec into a sequence of jsPsych trial objects.
 *
 * @param {object} spec       Trial spec from generateTrial.
 * @param {number} trialID    Unique trial number.
 * @param {number} blockID    Block this trial belongs to.
 * @param {boolean} practice  Whether this is a practice trial.
 * @param {number} [ringRadius=120]  Ring radius in pixels.
 * @returns {object[]} Array of 4 jsPsych trial objects (fixation, sample, retention, recall).
 */
export function assembleTrialSequence(spec, trialID, blockID, practice, jsPsych, ringRadius = 120) {
  // Compute ring positions once — reused by both sample and recall phases
  const { positions } = getRingPositions(spec.totalItems, ringRadius);

  // Data fields shared across all phases of this trial
  const sharedData = {
    condition: spec.condition,
    primaryDimension: spec.primaryDimension,
    totalItems: spec.totalItems,
    nPrimary: spec.nPrimary,
    nIntrude: spec.nIntrude,
    probeIndex: spec.probeIndex,
    probeDimension: spec.probeDimension,
    probeFeatureValue: spec.probeFeatureValue,
    items: spec.items,
  };

  // 1. Fixation — cross only, 500 ms
  const fixation = makePsychophysicsTrial({
    trialID,
    blockID,
    practice,
    choices: "NO_KEYS",
    trial_duration: fixationDurationMs,
    stimuli: [makeFixationCross()],
    data: { ...sharedData, phase: "fixation" },
  });

  // 2. Sample — stimuli + fixation cross, 150 ms × totalItems
  const sampleDuration = sampleDurationPerItemMs * spec.totalItems;
  const sample = makePsychophysicsTrial({
    trialID,
    blockID,
    practice,
    choices: "NO_KEYS",
    trial_duration: sampleDuration,
    stimuli: () => {
      const stims = buildStimuliFromSpec(spec.items, positions);
      stims.push(makeFixationCross());
      return stims;
    },
    data: { ...sharedData, phase: "sample", sampleDuration },
  });

  // 3. Retention — fixation cross only, 1000 ms
  const retention = makePsychophysicsTrial({
    trialID,
    blockID,
    practice,
    choices: "NO_KEYS",
    trial_duration: retentionDurationMs,
    stimuli: [makeFixationCross()],
    data: { ...sharedData, phase: "retention" },
  });

  // 4. Recall — 

  const probePos = positions[spec.probeIndex];
  const wheelOffset = Math.random() * 360;
  const { lightness, chroma } = Settings.stimuli;

  let isActive = false;
  let selectedAngle = undefined;

  const recall = makePsychophysicsTrial({
    trialID,
    blockID,
    practice,
    response_type: "key",
    choices: ["a"],
    stimuli: () => {
      const wheel = spec.probeDimension === "color" 
        ? createColorWheel(probePos.x, probePos.y, {offset: wheelOffset})
        : createOrientationWheel(probePos.x, probePos.y, {offset: wheelOffset}); 
      const probe = spec.probeDimension === "color"
        ? makeColorPatchStimulus(probePos.x, probePos.y, 0, { lightness: 0.6, chroma: 0 })
        : makeOrientedTriangleStimulus(probePos.x, probePos.y, 0, { lightness: Settings.display.backgroundLightness })
      const cross = makeFixationCross()
      return[wheel, probe, cross]
    },

    mouse_down_func: (e) => {
      if (!isActive) {
        isActive = true; // First click enables mouse_move tracking
      } else {
        // Second click terminates the trial
        document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
        document.body.dispatchEvent(new KeyboardEvent("keyup", { key: "a" }));
      }},

    mouse_move_func: (e) => {
      if (!isActive) {
        return // As long as no click was made, ignore the mouse position and movement
      } else {
        const live = jsPsych.getCurrentTrial().stimuli[1].instance // get the probe

        const { offsetX, offsetY } = e; // These are the mouse position values, provided as absolute canvas-pixel coordinates from the start (no origin_center applies here)
        const cx = live.currentX; // Canvas-pixel x
        const cy = live.currentY; // Canvas-pixel y

        // Compute mouse angle around the anchor center
        const deg = Math.atan2(offsetY - cy, offsetX - cx) * 180 / Math.PI;
        selectedAngle = (deg + wheelOffset + 360) % 360 // Add the offset

        // Orientation trial
        if (spec.probeDimension === "orientation") {
            live.fill_color = `oklch(${lightness} 0 0)`;
            live.line_color = `oklch(${lightness} 0 0)`;
            live.orientationDeg = selectedAngle;

        return;

      } else {
          live.fill_color = `oklch(${lightness} ${chroma} ${selectedAngle})`;
          live.line_color = `oklch(${lightness} ${chroma} ${selectedAngle})`;

        return
      }
      }
    },

    on_finish: (data) => {
      const chosenAngle = selectedAngle ?? undefined;
      data.wheelOffset = wheelOffset;
      data.selectedAngle = chosenAngle;
      data.signedError = signedAngleDiff(chosenAngle, spec.probeFeatureValue);
      data.absoluteError = Math.abs(data.signedError);
    },

    data: { ...sharedData, phase: "recall" },
  });

  return [fixation, sample, retention, recall];
}
