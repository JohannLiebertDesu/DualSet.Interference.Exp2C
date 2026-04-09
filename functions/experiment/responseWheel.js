/**
 * Response wheels for continuous report.
 *
 * Two wheel types:
 *   - Color wheel: a hue ring drawn in OKLCH, randomized offset per trial.
 *   - Orientation wheel: a black ring with graduation lines.
 *
 * Both are jspsych-psychophysics manual stimulus objects drawn via drawFunc.
 * Coordinates use origin_center: true (0, 0 = canvas centre).
 *
 * ── Two-click response protocol ──────────────────────────────────────────
 *
 * 1. Wheel appears at the probed item's position. No preview shown yet.
 * 2. Participant moves the mouse — nothing visible changes until they click.
 * 3. First click: a preview stimulus appears (colored patch or oriented
 *    triangle) reflecting the angle they clicked. Moving the mouse now
 *    updates the preview in real time.
 * 4. Second click: locks the response, ends the trial.
 *
 * This avoids displaying an initial feature value that could bias responses.
 */

import { Settings } from "../../ExperimentSettings.js";

// ── Color wheel ──────────────────────────────────────────────────────────

/**
 * Create a color wheel stimulus centered at (x, y).
 *
 * @param {number} x  Centre x (origin_center coords).
 * @param {number} y  Centre y (origin_center coords).
 * @param {object} [opts]
 * @param {number} [opts.outerRadius=60]  Outer radius in px.
 * @param {number} [opts.innerRadius=35]  Inner radius in px.
 * @param {number} [opts.offset]          Rotational offset in degrees (random if omitted).
 */
export function createColorWheel(x, y, opts = {}) {
  const { lightness, chroma } = Settings.stimuli;
  const {
    outerRadius = 60,
    innerRadius = 35,
    offset = Math.random() * 360,
  } = opts;

  return {
    obj_type: "manual",
    stim_type: "color_wheel",
    origin_center: true,
    startX: x,
    startY: y,
    outerRadius,
    innerRadius,
    offset,
    drawFunc: (stimulus, canvas, ctx) => {
      const cx = stimulus.currentX;
      const cy = stimulus.currentY;

      const numSegments = 360;
      const angleStep = (2 * Math.PI) / numSegments;

      for (let i = 0; i < numSegments; i++) {
        const startAngle = i * angleStep;
        const endAngle = startAngle + angleStep;
        const hue = ((i / numSegments) * 360 + stimulus.offset) % 360;

        ctx.beginPath();
        ctx.arc(cx, cy, stimulus.outerRadius, startAngle, endAngle, false);
        ctx.arc(cx, cy, stimulus.innerRadius, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = `oklch(${lightness} ${chroma} ${hue})`;
        ctx.fill();
      }
    },
  };
}

// ── Orientation wheel ────────────────────────────────────────────────────

/**
 * Create an orientation wheel stimulus centered at (x, y).
 *
 * A black annulus with evenly spaced graduation lines.
 *
 * @param {number} x  Centre x (origin_center coords).
 * @param {number} y  Centre y (origin_center coords).
 * @param {object} [opts]
 * @param {number} [opts.outerRadius=60]    Outer radius in px.
 * @param {number} [opts.innerRadius=35]    Inner radius in px.
 * @param {number} [opts.offset]            Rotational offset in degrees (random if omitted).
 * @param {number} [opts.numGraduations=16] Number of graduation lines.
 */
export function createOrientationWheel(x, y, opts = {}) {
  const {
    outerRadius = 60,
    innerRadius = 35,
    offset = Math.random() * 360,
    numGraduations = 16,
  } = opts;

  return {
    obj_type: "manual",
    stim_type: "orientation_wheel",
    origin_center: true,
    startX: x,
    startY: y,
    outerRadius,
    innerRadius,
    offset,
    drawFunc: (stimulus, canvas, ctx) => {
      const cx = stimulus.currentX;
      const cy = stimulus.currentY;

      // Black annulus
      ctx.beginPath();
      ctx.arc(cx, cy, stimulus.outerRadius, 0, 2 * Math.PI);
      ctx.arc(cx, cy, stimulus.innerRadius, 2 * Math.PI, 0, true);
      ctx.closePath();
      ctx.fillStyle = "black";
      ctx.fill();

      // Graduation lines
      const angleStep = (2 * Math.PI) / numGraduations;
      ctx.strokeStyle = "oklch(0.9 0 0)";
      ctx.lineWidth = 2;

      for (let i = 0; i < numGraduations; i++) {
        const angle = i * angleStep;
        ctx.beginPath();
        ctx.moveTo(
          cx + stimulus.innerRadius * Math.cos(angle),
          cy + stimulus.innerRadius * Math.sin(angle)
        );
        ctx.lineTo(
          cx + stimulus.outerRadius * Math.cos(angle),
          cy + stimulus.outerRadius * Math.sin(angle)
        );
        ctx.stroke();
      }
    },
  };
}

// ── Angle helper ─────────────────────────────────────────────────────────

/**
 * Compute the signed angular difference (a - b), wrapped to [-180, 180).
 */
export function signedAngleDiff(a, b) {
  return (((a - b + 540) % 360) - 180);
}

/**
 * Get the hue/orientation angle from a mouse position relative to a wheel centre.
 *
 * @param {number} mouseX    Mouse x in canvas coords.
 * @param {number} mouseY    Mouse y in canvas coords.
 * @param {number} cx        Wheel centre x in canvas coords.
 * @param {number} cy        Wheel centre y in canvas coords.
 * @param {number} offset    Wheel's rotational offset in degrees.
 * @returns {number} Angle in [0, 360).
 */
function mouseAngle(mouseX, mouseY, cx, cy, offset) {
  let deg = Math.atan2(mouseY - cy, mouseX - cx) * 180 / Math.PI;
  if (deg < 0) deg += 360;
  return (deg + offset + 360) % 360;
}
