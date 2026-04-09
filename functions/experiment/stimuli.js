/**
 * Stimulus factories for the cross-set–size experiment.
 *
 * Both return plain stimulus objects consumable by jspsych-psychophysics.
 * All coordinates assume origin_center: true (0, 0 = canvas centre).
 */

import { Settings } from "../../ExperimentSettings.js";

// ── Oriented triangle ────────────────────────────────────────────────────────

/**
 * Create a jspsych-psychophysics stimulus object for an isosceles triangle
 * drawn at the given position and orientation.
 *
 * The triangle is defined as an isosceles shape whose apex points "up" at 0°
 * and rotates clockwise with increasing orientation (matching standard
 * orientation-report conventions).
 *
 * @param {number} x            Centre x (origin_center coords).
 * @param {number} y            Centre y (origin_center coords).
 * @param {number} orientationDeg  Orientation in degrees [0, 360).
 * @param {object} [opts]
 * @param {number} [opts.base]       Base width in px.
 * @param {number} [opts.height]     Height (apex to base) in px.
 * @param {string} [opts.fillColor]  Fill colour (defaults from Settings.stimuli).
 * @param {string} [opts.lineColor]  Stroke colour (defaults from Settings.stimuli).
 * @param {number} [opts.lineWidth]
 */
export function makeOrientedTriangleStimulus(x, y, orientationDeg, opts = {}) {
  const {
    base = 28,
    height = 50,
    lightness = Settings.stimuli.lightness,
    chroma = Settings.stimuli.chroma,
    lineWidth = 1,
  } = opts;

  // Pre-compute the three vertices of the isosceles triangle centred at (0, 0)
  // before rotation.  Apex at top (negative y in canvas coords), base at bottom.
  const halfBase = base / 2;
  const cy = 0; // centroid y-offset: we centre the triangle on its centroid
  const apexY = -height * (2 / 3); // 2/3 above centroid
  const baseY = height * (1 / 3);  // 1/3 below centroid
  const unrotated = [
    { x: 0, y: apexY },             // apex
    { x: -halfBase, y: baseY },     // base-left
    { x: halfBase, y: baseY },      // base-right
  ];

  return {
    obj_type: "manual",
    stim_type: "oriented_triangle",
    origin_center: true,
    startX: x,
    startY: y,
    orientationDeg: orientationDeg,
    fill_color: `oklch(${lightness} 0 0)`,
    line_color: `oklch(${lightness} 0 0)`,

    drawFunc: (stimulus, canvas, ctx) => {

      const rad = (stimulus.orientationDeg * Math.PI) / 180;
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

// ── Colored patch (circle) ───────────────────────────────────────────────────

/**
 * Create a jspsych-psychophysics stimulus object for a coloured circle.
 *
 * Colour is specified as a hue angle in OKLCH space; lightness and chroma
 * are held constant so that all hues are perceptually equiluminant.
 *
 * @param {number} x          Centre x (origin_center coords).
 * @param {number} y          Centre y (origin_center coords).
 * @param {number} hueDeg     Hue angle in degrees [0, 360).
 * @param {object} [opts]
 * @param {number} [opts.radius]       Radius in px.
 * @param {number} [opts.lightness]    OKLCH lightness (defaults from Settings.stimuli).
 * @param {number} [opts.chroma]       OKLCH chroma (defaults from Settings.stimuli).
 */
export function makeColorPatchStimulus(x, y, hueDeg, opts = {}) {
  const {
    radius = 15,
    lightness = Settings.stimuli.lightness,
    chroma = Settings.stimuli.chroma,
  } = opts;

  return {
    obj_type: "circle",
    stim_type: "color_patch",
    origin_center: true,
    startX: x,
    startY: y,
    radius,
    fill_color: `oklch(${lightness} ${chroma} ${hueDeg})`,
    line_color: `oklch(${lightness} ${chroma} ${hueDeg})`,
  };
}

// ── Fixation cross ───────────────────────────────────────────────────────────

/**
 * Create a jspsych-psychophysics fixation cross at canvas centre.
 *
 * @param {object} [opts]
 * @param {number} [opts.lineLength]  Arm length in px.
 */
export function makeFixationCross(opts = {}) {
  const { lineLength = 12 } = opts;

  return {
    obj_type: "cross",
    stim_type: "fixation",
    origin_center: true,
    startX: 0,
    startY: 0,
    line_length: lineLength,
    line_color: "oklch(1 0 0)", // White fixation cross
  };
}
