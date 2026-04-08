/**
 * Stimulus factories for the cross-set–size experiment.
 *
 * Both return plain stimulus objects consumable by jspsych-psychophysics.
 * All coordinates assume origin_center: true (0, 0 = canvas centre).
 */

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
 * @param {number} [opts.base=16]       Base width in px.
 * @param {number} [opts.height=28]     Height (apex to base) in px.
 * @param {string} [opts.fillColor='oklch(0.75 0 0)']  Fill colour.
 * @param {string} [opts.lineColor='oklch(0.75 0 0)']  Stroke colour.
 * @param {number} [opts.lineWidth=1]
 */
export function makeOrientedTriangleStimulus(x, y, orientationDeg, opts = {}) {
  const {
    base = 16,
    height = 28,
    fillColor = "oklch(0.75 0 0)",
    lineColor = "oklch(0.75 0 0)",
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

  const rad = (orientationDeg * Math.PI) / 180;
  const cosA = Math.cos(rad);
  const sinA = Math.sin(rad);
  const rotated = unrotated.map((p) => ({
    x: p.x * cosA - p.y * sinA,
    y: p.x * sinA + p.y * cosA,
  }));

  return {
    obj_type: "manual",
    stim_type: "oriented_triangle",
    origin_center: true,
    startX: x,
    startY: y,
    drawFunc: (stimulus, canvas, ctx) => {
      ctx.save();
      ctx.translate(stimulus.currentX, stimulus.currentY);

      ctx.beginPath();
      ctx.moveTo(rotated[0].x, rotated[0].y);
      ctx.lineTo(rotated[1].x, rotated[1].y);
      ctx.lineTo(rotated[2].x, rotated[2].y);
      ctx.closePath();

      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = lineColor;
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
 * @param {number} [opts.radius=10]       Radius in px.
 * @param {number} [opts.lightness=0.7]   OKLCH lightness.
 * @param {number} [opts.chroma=0.15]     OKLCH chroma.
 */
export function makeColorPatchStimulus(x, y, hueDeg, opts = {}) {
  const { radius = 10, lightness = 0.7, chroma = 0.15 } = opts;

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
