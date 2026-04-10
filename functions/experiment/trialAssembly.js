/**
 * Single-trial assembly — converts a trial spec into a sequence of
 * jsPsych trial objects representing the temporal phases of one trial:
 *
 *   1. Fixation    — fixation cross only, 1000 ms
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
  return items.map((item) => {
    const pos = positions[item.ringPosition];
    if (item.dimension === "orientation") {
      return makeOrientedTriangleStimulus(pos.x, pos.y, item.featureValue);
    } else {
      return makeColorPatchStimulus(pos.x, pos.y, item.featureValue);
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
 * @param {object} jsPsych    The active jsPsych instance (for live stimulus access in recall).
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
    on_start: () => { document.body.style.cursor = "none"; },
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

  // 4. Recall — response wheel + invisible probe at probed item position.
  //    Two-click protocol: first click reveals probe and starts tracking,
  //    second click confirms. Stimuli created here (not in a function) so
  //    getCurrentTrial().stimuli[n].instance works in mouse handlers.

  const probePos = positions[spec.items[spec.probeIndex].ringPosition];
  const wheelOffset = Math.random() * 360;
  const { lightness, chroma } = Settings.stimuli;

  let isActive = false;
  let selectedAngle = undefined;
  let firstClickTime = null;
  let trialStartTime = null;

  // The wheel is drawn starting at 0° (rightward on screen). The wheelOffset
  // shifts which hue/orientation value sits at each screen position — e.g. if
  // offset=30, hue 30 is drawn at the right, and hue 0 shifts slightly upward.
  // This prevents participants from learning fixed hue-to-position mappings.
  const wheel = spec.probeDimension === "color"
    ? createColorWheel(probePos.x, probePos.y, { offset: wheelOffset })
    : createOrientationWheel(probePos.x, probePos.y, { offset: wheelOffset });

  // Probe starts invisible (matching background) — revealed on first click.
  const probe = spec.probeDimension === "color"
    ? makeColorPatchStimulus(probePos.x, probePos.y, 0, { lightness: Settings.display.backgroundLightness, chroma: 0 })
    : makeOrientedTriangleStimulus(probePos.x, probePos.y, 0, { lightness: Settings.display.backgroundLightness });
  const cross = makeFixationCross();

  // Compute angle and update probe appearance from a mouse event.
  // Shared by mouse_down_func (first click) and mouse_move_func (tracking).
  function updateProbeFromMouse(e) {
    const live = jsPsych.getCurrentTrial().stimuli[1].instance;
    const dx = e.offsetX - live.currentX;
    const dy = e.offsetY - live.currentY;

    // deg = raw screen angle of the mouse relative to probe centre.
    // atan2 convention: 0° = right, 90° = down, 270° = up.
    let deg = Math.atan2(dy, dx) * 180 / Math.PI;
    if (deg < 0) deg += 360;

    if (spec.probeDimension === "orientation") {
      // Orientation wheel has no visual offset — the raw atan2 angle
      // IS the orientation value. No wheelOffset conversion needed.
      selectedAngle = deg;
      live.fill_color = `oklch(${lightness} 0 0)`;
      live.line_color = `oklch(${lightness} 0 0)`;
      // The +90° in drawFunc converts from atan2 (0°=right) to the
      // triangle's native up-pointing apex.
      live.orientationDeg = deg;
    } else {
      // Color wheel shifts hues by wheelOffset: screen position i shows
      // hue (i + offset). Adding wheelOffset converts from screen angle
      // to the actual hue value.
      selectedAngle = (deg + wheelOffset + 360) % 360;
      live.fill_color = `oklch(${lightness} ${chroma} ${selectedAngle})`;
      live.line_color = `oklch(${lightness} ${chroma} ${selectedAngle})`;
    }
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
        updateProbeFromMouse(e); // Reveal probe immediately at click position
      } else {
        // Second click terminates the trial
        document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "F24" }));
        document.body.dispatchEvent(new KeyboardEvent("keyup", { key: "F24" }));
      }
    },

    mouse_move_func: (e) => {
      if (!isActive) return;
      updateProbeFromMouse(e);
    },

    on_finish: (data) => {
      const chosenAngle = selectedAngle ?? undefined;
      data.wheelOffset = wheelOffset;
      data.selectedAngle = chosenAngle;
      data.signedError = signedAngleDiff(chosenAngle, spec.probeFeatureValue);
      data.absoluteError = Math.abs(data.signedError);
      data.firstClickRt = firstClickTime && trialStartTime
        ? firstClickTime - trialStartTime
        : null;
    },

    data: { ...sharedData, phase: "recall" },
  });

  const sequence = [fixation, sample, retention, recall];

  // 5. Feedback — practice trials only.
  //    Re-draws the wheel and the participant's response (frozen), adds a
  //    marker at the correct position, and shows a smiley based on error.
  if (practice) {
    // Correct answer's screen angle on the wheel.
    // Color wheel: maps screen position i to hue (i + wheelOffset), so reverse
    //   with screen position = featureValue - wheelOffset.
    // Orientation wheel: no visual offset, so screen position = featureValue.
    const correctScreenAngle = spec.probeDimension === "color"
      ? ((spec.probeFeatureValue - wheelOffset + 360) % 360) * Math.PI / 180
      : (spec.probeFeatureValue * Math.PI) / 180;

    // Pre-build the probe stimulus frozen at the selected value.
    // We clone it so it doesn't interfere with the recall trial's probe.
    const frozenProbe = spec.probeDimension === "color"
      ? makeColorPatchStimulus(probePos.x, probePos.y, 0, { lightness: Settings.display.backgroundLightness, chroma: 0 })
      : makeOrientedTriangleStimulus(probePos.x, probePos.y, 0, { lightness: Settings.display.backgroundLightness });

    const feedbackWheel = spec.probeDimension === "color"
      ? createColorWheel(probePos.x, probePos.y, { offset: wheelOffset })
      : createOrientationWheel(probePos.x, probePos.y, { offset: wheelOffset });

    // Marker for the correct answer (drawn as a manual stimulus)
    const correctMarker = {
      obj_type: "manual",
      origin_center: true,
      startX: probePos.x,
      startY: probePos.y,
      drawFunc: (stimulus, canvas, ctx) => {
        const cx = stimulus.currentX;
        const cy = stimulus.currentY;
        const markerRadius = (Settings.responseWheel.outerRadius + Settings.responseWheel.innerRadius) / 2;
        const mx = cx + markerRadius * Math.cos(correctScreenAngle);
        const my = cy + markerRadius * Math.sin(correctScreenAngle);

        // Draw a white circle with black outline as the correct-answer marker
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
      trial_duration: 3000,
      stimuli: [feedbackWheel, frozenProbe, correctMarker, makeFixationCross()],

      on_start: () => {
        // Freeze the probe at the participant's selected value
        const absError = Math.abs(signedAngleDiff(selectedAngle ?? 0, spec.probeFeatureValue));

        // Pick smiley based on error magnitude
        let smileyPath;
        if (absError < 25) {
          smileyPath = "assets/happy.svg";
        } else if (absError < 50) {
          smileyPath = "assets/medium.svg";
        } else {
          smileyPath = "assets/sad.svg";
        }

        // Show smiley above the canvas
        const img = document.createElement("img");
        img.src = smileyPath;
        img.id = "feedback-smiley";
        img.style.cssText = "position:fixed; top:10%; left:50%; transform:translateX(-50%); height:8vh; z-index:1000;";
        document.body.appendChild(img);
      },

      on_load: () => {
        // Set the frozen probe to the selected value
        const live = jsPsych.getCurrentTrial().stimuli[1].instance;
        if (selectedAngle !== undefined) {
          if (spec.probeDimension === "orientation") {
            live.fill_color = `oklch(${lightness} 0 0)`;
            live.line_color = `oklch(${lightness} 0 0)`;
            live.orientationDeg = selectedAngle;
          } else {
            live.fill_color = `oklch(${lightness} ${chroma} ${selectedAngle})`;
            live.line_color = `oklch(${lightness} ${chroma} ${selectedAngle})`;
          }
        }
      },

      on_finish: () => {
        // Remove the smiley overlay
        const smiley = document.getElementById("feedback-smiley");
        if (smiley) smiley.remove();
      },

      data: { ...sharedData, phase: "feedback" },
    });

    sequence.push(feedback);
  }

  return sequence;
}
