/**
 * Experiment design — Exp2B replication (Exp2C, with triangle stimuli + 200 ms/item).
 *
 * ── Within-subject factors ───────────────────────────────────────────────
 *
 *   blockType: "Combined" | "Split"
 *     - Combined: All items shown simultaneously. Set size 3 (one side) or 6
 *       (both sides). Both probed items drawn at random from the display.
 *     - Split:    3 items shown on the left, brief ISI, then 3 items on the
 *       right (total 6 items across 2 screens). Items always 6 per Split trial.
 *
 *   numItems: 3 | 6
 *     - Combined blocks mix 3-item and 6-item trials (half each).
 *     - Split blocks are always 6-item.
 *
 * ── Between-subject factor (from Settings.recruitment.conditions) ───────
 *
 *   blockOrder: "CS" (Combined first) | "SC" (Split first)
 *
 * Split blocks always probe right → left (ABBA). The Exp2B unpredictable
 * (random-order) variant has been dropped in Exp2C.
 *
 * ── Probing rule ─────────────────────────────────────────────────────────
 *
 * Two items are probed sequentially per trial (tested_first, tested_second).
 *
 *   Combined / 3 items:  any 2 of the 3 (random).
 *   Combined / 6 items:  any 2 of the 6 (random).
 *   Split    / 6 items:  1 right + 1 left, right probed first (ABBA).
 *
 * ── Feature values ───────────────────────────────────────────────────────
 *
 * Each item's orientation is sampled independently, uniform on [0, 360).
 * No minimum-distance constraint (matches Exp2B).
 */

// Parse a between-subject condition label ("CS" or "SC") into its component.
export function parseCondition(label) {
  return { blockOrder: label === "SC" ? "SC" : "CS" };
}

// ── Block-level trial composition ────────────────────────────────────────

/**
 * Trial counts per mini-block (ported from Exp2B runExperiment.ts).
 * Combined mini-block: 16× 3-item + 16× 6-item = 32
 * Split mini-block:    32× 6-item             = 32
 */
export const MAIN_TRIALS_PER_MINIBLOCK = 32;
export const PRACTICE_TRIALS_PER_BLOCK = 12;
export const MAIN_MINIBLOCKS_PER_BLOCK = 3;

/** Compose the trial set sizes for a mini-block. */
export function makeMainSetSizes(blockType) {
  if (blockType === "Combined") {
    return [
      ...Array(16).fill(3),
      ...Array(16).fill(6),
    ];
  }
  // Split → always 6 items per trial
  return Array(MAIN_TRIALS_PER_MINIBLOCK).fill(6);
}

export function makePracticeSetSizes(blockType) {
  if (blockType === "Combined") {
    return [
      ...Array(6).fill(3),
      ...Array(6).fill(6),
    ];
  }
  return Array(PRACTICE_TRIALS_PER_BLOCK).fill(6);
}

// ── Single-trial spec generation ─────────────────────────────────────────

function sampleOrientations(n) {
  return Array.from({ length: n }, () => Math.random() * 360);
}

/**
 * Pick two distinct random indices in [0, n).
 */
function pickTwo(n) {
  const a = Math.floor(Math.random() * n);
  let b = Math.floor(Math.random() * (n - 1));
  if (b >= a) b += 1;
  return [a, b];
}

/**
 * Generate a single trial specification.
 *
 * The spec is self-contained: a downstream trialAssembly module can expand it
 * into the sequence of jsPsych trial objects (fixation → sample(s) → retention
 * → probe1 → probe2) without needing to know the block-level context.
 *
 * @param {object} opts
 * @param {"Combined"|"Split"} opts.blockType
 * @param {3|6} opts.numItems
 * @returns {object} Trial spec.
 */
export function generateTrial({ blockType, numItems }) {
  // Per-item sides. Drives both spatial placement and (for Split) screen grouping.
  let sides;
  if (blockType === "Split") {
    // 3 left + 3 right. Order matters: first 3 = left screen, next 3 = right screen.
    sides = [...Array(3).fill("left"), ...Array(3).fill("right")];
  } else if (numItems === 3) {
    // Combined / 3: one side chosen randomly so the grid exclusion logic has room.
    const side = Math.random() < 0.5 ? "left" : "right";
    sides = Array(3).fill(side);
  } else {
    // Combined / 6: 3 left + 3 right, all shown on one screen.
    sides = [...Array(3).fill("left"), ...Array(3).fill("right")];
  }

  const orientations = sampleOrientations(numItems);
  const items = sides.map((side, i) => ({
    side,
    orientationDeg: orientations[i],
  }));

  // ── Pick the two items to probe ────────────────────────────────────────
  let probe1Index, probe2Index;

  if (blockType === "Combined") {
    // Combined: any two items regardless of side (random order).
    [probe1Index, probe2Index] = pickTwo(numItems);
  } else {
    // Split (always ABBA): one item per side, right (most recent) probed first.
    const leftChoice = Math.floor(Math.random() * 3);          // indices 0–2
    const rightChoice = 3 + Math.floor(Math.random() * 3);     // indices 3–5
    probe1Index = rightChoice;
    probe2Index = leftChoice;
  }

  return {
    blockType,
    numItems,
    // Presentation order retained in the spec for clean data columns:
    // Combined has no canonical order; Split is always ABBA in Exp2C.
    presentationOrder: blockType === "Split" ? "ABBA" : "random",
    items,
    probe1Index,
    probe2Index,
  };
}
