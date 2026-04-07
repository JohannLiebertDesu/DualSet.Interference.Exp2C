/**
 * OKLCH colour utilities.
 *
 * Conversion pipeline: OKLCH → Oklab → LMS → linear sRGB → sRGB → hex/RGB.
 * Based on Björn Ottosson's Oklab specification.
 * https://bottosson.github.io/posts/oklab/
 *
 * OKLCH is perceptually uniform — equal steps in lightness, chroma, or hue
 * produce equal perceptual differences, which makes it ideal for generating
 * stimulus colours in psychophysics experiments.
 *
 * Usage:
 *   import { oklchToHex, oklchToRgb, oklchToCss, generateHues } from "../../functions/global/color.js";
 *
 *   oklchToHex(0.6, 0.15, 30)       // "#c4744a"
 *   oklchToRgb(0.6, 0.15, 30)       // { r: 196, g: 116, b: 74 }
 *   oklchToCss(0.6, 0.15, 30)       // "oklch(0.6 0.15 30)"
 *   generateHues(6, 0.7, 0.15)      // 6 evenly spaced hex colours at L=0.7, C=0.15
 */

// ── Internal conversion steps ────────────────────────────────────────────────

/** OKLCH (polar) → Oklab (cartesian). */
function oklchToOklab(l, c, h) {
  const hRad = h * (Math.PI / 180);
  return { l, a: c * Math.cos(hRad), b: c * Math.sin(hRad) };
}

/** Oklab → linear sRGB via LMS intermediate. */
function oklabToLinearSrgb(l, a, b) {
  // Oklab → LMS (cube-root domain)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b;

  // Cube to get LMS
  const lc = l_ * l_ * l_;
  const mc = m_ * m_ * m_;
  const sc = s_ * s_ * s_;

  // LMS → linear sRGB
  return {
    r: +4.0767416621 * lc - 3.3077115913 * mc + 0.2309699292 * sc,
    g: -1.2684380046 * lc + 2.6097574011 * mc - 0.3413193965 * sc,
    b: -0.0041960863 * lc - 0.7034186147 * mc + 1.7076147010 * sc,
  };
}

/** Linear sRGB → sRGB (apply gamma). */
function gammaEncode(v) {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
}

/** Clamp a value to 0–1. */
function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/** Single 0–1 float → two-character hex. */
function toHex(v) {
  const hex = Math.round(v * 255).toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Convert OKLCH to a hex colour string.
 * Out-of-gamut values are clamped to sRGB.
 *
 * @param {number} l - Lightness (0–1)
 * @param {number} c - Chroma (0–~0.37, depends on hue)
 * @param {number} h - Hue angle in degrees (0–360)
 * @returns {string} Hex string, e.g. "#c4744a"
 */
export function oklchToHex(l, c, h) {
  const lab = oklchToOklab(l, c, h);
  const lin = oklabToLinearSrgb(lab.l, lab.a, lab.b);
  const r = clamp01(gammaEncode(lin.r));
  const g = clamp01(gammaEncode(lin.g));
  const b = clamp01(gammaEncode(lin.b));
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert OKLCH to an RGB object with 0–255 integer values.
 * Out-of-gamut values are clamped to sRGB.
 *
 * @param {number} l - Lightness (0–1)
 * @param {number} c - Chroma (0–~0.37)
 * @param {number} h - Hue angle in degrees (0–360)
 * @returns {{ r: number, g: number, b: number }} RGB values 0–255
 */
export function oklchToRgb(l, c, h) {
  const lab = oklchToOklab(l, c, h);
  const lin = oklabToLinearSrgb(lab.l, lab.a, lab.b);
  return {
    r: Math.round(clamp01(gammaEncode(lin.r)) * 255),
    g: Math.round(clamp01(gammaEncode(lin.g)) * 255),
    b: Math.round(clamp01(gammaEncode(lin.b)) * 255),
  };
}

/**
 * Return a CSS oklch() string. No conversion needed — modern browsers
 * parse this natively. Useful when you want perceptual accuracy without
 * sRGB clamping (the browser handles gamut mapping).
 *
 * @param {number} l - Lightness (0–1)
 * @param {number} c - Chroma (0–~0.37)
 * @param {number} h - Hue angle in degrees (0–360)
 * @returns {string} CSS string, e.g. "oklch(0.6 0.15 30)"
 */
export function oklchToCss(l, c, h) {
  return `oklch(${l} ${c} ${h})`;
}

/**
 * Generate N evenly spaced colours around the OKLCH hue circle.
 *
 * Commonly used for colour wheels, condition coding, or stimulus sets
 * where you need maximally distinct colours at equal perceptual spacing.
 *
 * @param {number} n         - Number of colours to generate
 * @param {number} [l=0.7]   - Lightness (shared by all colours)
 * @param {number} [c=0.15]  - Chroma (shared by all colours)
 * @param {number} [startHue=0] - Starting hue angle in degrees
 * @param {string} [format="hex"] - Output format: "hex", "rgb", or "css"
 * @returns {Array} Array of colours in the requested format
 */
export function generateHues(n, l = 0.7, c = 0.15, startHue = 0, format = "hex") {
  const step = 360 / n;
  const convert =
    format === "rgb" ? oklchToRgb :
    format === "css" ? oklchToCss :
    oklchToHex;
  return Array.from({ length: n }, (_, i) => convert(l, c, (startHue + i * step) % 360));
}
