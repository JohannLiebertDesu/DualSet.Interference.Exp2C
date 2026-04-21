/**
 * Orientation response wheel for continuous report.
 *
 * Drawn as a manual psychophysics stimulus in absolute pixel coordinates
 * (origin_center: false) so it can be placed directly on the grid-derived
 * item positions.
 *
 * ── Two-click response protocol (matches Exp2C template convention) ─────
 *
 * 1. Wheel appears at the probed item's position. No preview shown yet.
 * 2. Participant moves the mouse — nothing visible changes until they click.
 * 3. First click: a preview triangle appears reflecting the clicked angle.
 *    Moving the mouse now updates the preview in real time.
 * 4. Second click: locks the response, ends the trial.
 */

import { Settings } from "../../ExperimentSettings.js";

/**
 * Create an orientation wheel stimulus centered at (x, y).
 *
 * @param {number} x  Centre x (absolute pixels).
 * @param {number} y  Centre y (absolute pixels).
 * @param {object} [opts]
 * @param {number} [opts.outerRadius]
 * @param {number} [opts.innerRadius]
 * @param {number} [opts.numGraduations]
 * @param {number} [opts.lightness]
 */
export function createOrientationWheel(x, y, opts = {}) {
  const {
    outerRadius,
    innerRadius,
    numGraduations = Settings.responseWheel.numGraduations,
    lightness = Settings.stimuli.lightness,
  } = opts;

  if (outerRadius == null || innerRadius == null) {
    throw new Error("createOrientationWheel: outerRadius and innerRadius are required.");
  }

  return {
    obj_type: "manual",
    stim_type: "orientation_wheel",
    origin_center: false,
    startX: x,
    startY: y,
    outerRadius,
    innerRadius,
    drawFunc: (stimulus, canvas, ctx) => {
      const cx = stimulus.currentX;
      const cy = stimulus.currentY;

      // Black annulus
      ctx.beginPath();
      ctx.arc(cx, cy, stimulus.outerRadius, 0, 2 * Math.PI);
      ctx.arc(cx, cy, stimulus.innerRadius, 2 * Math.PI, 0, true);
      ctx.closePath();
      ctx.fillStyle = `oklch(${lightness} 0 0)`;
      ctx.fill();

      // Graduation lines
      const angleStep = (2 * Math.PI) / numGraduations;
      ctx.strokeStyle = "oklch(1 0 0)";
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

/**
 * Compute the signed angular difference (a - b), wrapped to [-180, 180).
 */
export function signedAngleDiff(a, b) {
  return (((a - b + 540) % 360) - 180);
}
