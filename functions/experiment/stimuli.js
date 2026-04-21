/**
 * Stimulus factories for the Exp2B replication.
 *
 * Orientation-only experiment: isosceles triangles pointing in a direction.
 *
 * Coordinates are ABSOLUTE pixels from the canvas top-left (origin_center: false)
 * so positions produced by gridPositioning.js can be used directly.
 */

import { Settings } from "../../ExperimentSettings.js";

// ── Oriented triangle ────────────────────────────────────────────────────────

/**
 * Create a jspsych-psychophysics stimulus object for an isosceles triangle
 * drawn at the given position and orientation.
 *
 * The triangle's apex points "up" at 0° (negative y) and rotates clockwise
 * with increasing orientation, matching standard orientation-report conventions.
 *
 * Base and height are required and typically come from getTriangleDimensions()
 * in gridPositioning.js, which derives them from the Exp2B-style grid radius
 * so that the triangle's area matches a circle of the same radius.
 *
 * @param {number} x            Centre x (absolute pixels).
 * @param {number} y            Centre y (absolute pixels).
 * @param {number} orientationDeg  Orientation in degrees [0, 360).
 * @param {object} opts
 * @param {number} opts.base         Base width in px.
 * @param {number} opts.height       Apex-to-base height in px.
 * @param {number} [opts.lightness]  OKLCH lightness for fill/outline.
 * @param {number} [opts.lineWidth]
 */
export function makeOrientedTriangleStimulus(x, y, orientationDeg, opts = {}) {
  const {
    base,
    height,
    lightness = Settings.stimuli.lightness,
    lineWidth = 1,
  } = opts;

  if (base == null || height == null) {
    throw new Error("makeOrientedTriangleStimulus: base and height are required.");
  }

  // Pre-compute the three vertices of the isosceles triangle centred at its
  // centroid before rotation. Apex at top (negative y in canvas coords).
  const halfBase = base / 2;
  const apexY = -height * (2 / 3);
  const baseY = height * (1 / 3);
  const unrotated = [
    { x: 0, y: apexY },             // apex
    { x: -halfBase, y: baseY },     // base-left
    { x: halfBase, y: baseY },      // base-right
  ];

  return {
    obj_type: "manual",
    stim_type: "oriented_triangle",
    origin_center: false,
    startX: x,
    startY: y,
    orientationDeg: orientationDeg,
    fill_color: `oklch(${lightness} 0 0)`,
    line_color: `oklch(${lightness} 0 0)`,

    drawFunc: (stimulus, canvas, ctx) => {
      // +90° offset: the unrotated apex points up (negative y), but atan2's
      // 0° is rightward. Adding 90° rotates the apex from up to right,
      // so the triangle points toward the mouse position during recall.
      const rad = ((stimulus.orientationDeg + 90) * Math.PI) / 180;
      const cosA = Math.cos(rad);
      const sinA = Math.sin(rad);
      const rotated = unrotated.map((p) => ({
        x: p.x * cosA - p.y * sinA,
        y: p.x * sinA + p.y * cosA,
      }));

      ctx.save();
      ctx.translate(stimulus.currentX, stimulus.currentY);

      ctx.beginPath();
      ctx.moveTo(rotated[0].x, rotated[0].y);
      ctx.lineTo(rotated[1].x, rotated[1].y);
      ctx.lineTo(rotated[2].x, rotated[2].y);
      ctx.closePath();

      ctx.fillStyle = stimulus.fill_color;
      ctx.fill();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = stimulus.line_color;
      ctx.stroke();

      ctx.restore();
    },
  };
}

