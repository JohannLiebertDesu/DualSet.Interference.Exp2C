/**
 * Experiment design for the cross-set–size experiment.
 *
 * Defines the condition table and a function to generate a single trial
 * specification. Does not handle trial counts, block structure, practice,
 * or rendering — those belong in experimentAssembly.js and trialRendering.js.
 *
 * ── Condition structure ──────────────────────────────────────────────────
 *
 * Each trial has a "primary dimension" (orientation or color) — the dimension
 * that defines the condition and from which most items are drawn.
 *
 * Per primary dimension (orientation and color each):
 *   3-only:  3 items of primary dimension
 *   4-only:  4 items of primary dimension
 *   6-only:  6 items of primary dimension
 *   3+1:     3 primary + 1 intruder of the other dimension
 *   3+3:     3 primary + 3 of the other dimension (shared)
 *
 * The 3+3 condition is shared between dimensions: probing orientation
 * and probing color are separate conditions.
 *
 * ── Probing rule ─────────────────────────────────────────────────────────
 *
 * Each item is equally likely to be probed. The probed item index is
 * passed in by the caller (experimentAssembly.js handles cycling).
 *
 * ── Feature value sampling ───────────────────────────────────────────────
 *
 * Within each dimension, feature values (hue or orientation in degrees)
 * maintain a minimum pairwise distance of 30°. Implemented via gap-based
 * sampling in featureSampling.js.
 */

import { sampleFeatureValues } from "./featureSampling.js";

const MIN_DISTANCE_DEG = 30;

// ── Condition definitions ────────────────────────────────────────────────

export const CONDITIONS = [
  // Pure orientation conditions
  { name: "orientation_3only", primary: "orientation", nPrimary: 3, nIntrude: 0, nTrials: 20 },
  { name: "orientation_4only", primary: "orientation", nPrimary: 4, nIntrude: 0, nTrials: 20 },
  { name: "orientation_6only", primary: "orientation", nPrimary: 6, nIntrude: 0, nTrials: 20 },
  { name: "orientation_3plus1", primary: "orientation", nPrimary: 3, nIntrude: 1, nTrials: 80 },

  // Pure color conditions
  { name: "color_3only", primary: "color", nPrimary: 3, nIntrude: 0, nTrials: 20 },
  { name: "color_4only", primary: "color", nPrimary: 4, nIntrude: 0, nTrials: 20 },
  { name: "color_6only", primary: "color", nPrimary: 6, nIntrude: 0, nTrials: 20 },
  { name: "color_3plus1", primary: "color", nPrimary: 3, nIntrude: 1, nTrials: 80 },

  // Shared 3+3: 20 trials probing orientation, 20 probing color
  { name: "mixed_3plus3_probeOrientation", primary: "orientation", nPrimary: 3, nIntrude: 3, nTrials: 20 },
  { name: "mixed_3plus3_probeColor", primary: "color", nPrimary: 3, nIntrude: 3, nTrials: 20 },
];

// ── Trial generation ─────────────────────────────────────────────────────

/**
 * Generate a single trial specification.
 *
 * @param {object} condition  A condition definition from CONDITIONS.
 * @param {number} probeIndex Which item index (0-based) to probe.
 * @returns {object} Trial specification with all information needed to render.
 */
export function generateTrial(condition, probeIndex) {
  const totalItems = condition.nPrimary + condition.nIntrude;

  // Items are ordered [primary, primary, ..., intruder, intruder, ...].
  // If probeIndex falls within the primary range → probe the primary dimension.
  // Otherwise → probe the opposite dimension (i.e. the intruder's dimension).
  const probeDimension = probeIndex < condition.nPrimary ? condition.primary
    : (condition.primary === "orientation" ? "color" : "orientation");

  // Figure out how many items of each dimension we need, regardless of
  // which one is "primary". If a dimension has 0 items, it gets no values.
  const nOrientation = condition.primary === "orientation" ? condition.nPrimary : condition.nIntrude;
  const nColor = condition.primary === "color" ? condition.nPrimary : condition.nIntrude;

  const orientationValues = nOrientation > 0 ? sampleFeatureValues(nOrientation, MIN_DISTANCE_DEG) : [];
  const colorValues = nColor > 0 ? sampleFeatureValues(nColor, MIN_DISTANCE_DEG) : [];

  // Build item list: primary items first, then intruders.
  // Array order determines logical structure (probeIndex refers to this order).
  // ringPosition (assigned below) determines spatial placement on screen.
  const items = [];

  if (condition.primary === "orientation") {
    for (let i = 0; i < condition.nPrimary; i++) {
      items.push({ dimension: "orientation", featureValue: orientationValues[i] });
    }
    for (let i = 0; i < condition.nIntrude; i++) {
      items.push({ dimension: "color", featureValue: colorValues[i] });
    }
  } else {
    for (let i = 0; i < condition.nPrimary; i++) {
      items.push({ dimension: "color", featureValue: colorValues[i] });
    }
    for (let i = 0; i < condition.nIntrude; i++) {
      items.push({ dimension: "orientation", featureValue: orientationValues[i] });
    }
  }

  // Assign ring positions based on condition type.
  // ringPosition determines which slot on the invisible ring each item occupies,
  // independent of its index in the items array.
  if (condition.nIntrude === 0) {
    // Pure condition (3-only, 4-only, 6-only): randomized positions so that
    // sequential feature values from the sampling algorithm don't map onto
    // adjacent ring slots (which would create a visible gradient).
    const slots = Array.from({ length: totalItems }, (_, i) => i);
    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }
    items.forEach((item, i) => { item.ringPosition = slots[i]; });

  } else if (condition.nPrimary === 3 && condition.nIntrude === 1) {
    // 3+1: intruder randomly assigned to one of the 4 slots.
    // Primary items fill the remaining 3 slots.
    const intruderSlot = Math.floor(Math.random() * totalItems);
    const primarySlots = [0, 1, 2, 3].filter(s => s !== intruderSlot);
    for (let i = 0; i < condition.nPrimary; i++) {
      items[i].ringPosition = primarySlots[i];
    }
    items[condition.nPrimary].ringPosition = intruderSlot;

  } else if (condition.nPrimary === 3 && condition.nIntrude === 3) {
    // 3+3: interleaved (alternating primary, intruder around the ring).
    // Randomly assign primary to even or odd slots to avoid a fixed pattern.
    const primaryAtEven = Math.random() < 0.5;
    for (let i = 0; i < condition.nPrimary; i++) {
      items[i].ringPosition = primaryAtEven ? i * 2 : i * 2 + 1;
    }
    for (let i = 0; i < condition.nIntrude; i++) {
      items[condition.nPrimary + i].ringPosition = primaryAtEven ? i * 2 + 1 : i * 2;
    }
  }

  return {
    condition: condition.name,
    primaryDimension: condition.primary,
    totalItems,
    nPrimary: condition.nPrimary,
    nIntrude: condition.nIntrude,
    probeIndex,
    probeDimension,
    probeFeatureValue: items[probeIndex].featureValue,
    items,
  };
}
