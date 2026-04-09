/**
 * Experiment assembly — builds the full trial pool from the experiment design.
 *
 * Takes the condition table and single-trial generator from experimentDesign.js,
 * generates all specs, assigns trialIDs/blockIDs/practice flags, shuffles
 * into mini-blocks, and passes each spec through trialAssembly.js to produce
 * the 4-phase jsPsych trial sequences.
 *
 * ── Trial counts (from ExperimentGoal.md) ────────────────────────────────
 *
 * Per primary dimension (orientation and color each):
 *   3-only:  20 trials
 *   4-only:  20 trials
 *   6-only:  20 trials
 *   3+1:     80 trials
 *   3+3:     20 trials (shared across dimensions, 40 total)
 *
 * Grand total: 320 experimental + 10 practice
 * Structure: 8 mini-blocks × 40 trials, randomly drawn from the pool.
 * Practice: 1 trial per condition (10 total).
 */

import { CONDITIONS, generateTrial } from "./experimentDesign.js";
import { assembleTrialSequence } from "./trialAssembly.js";

// ── Shuffling utility ────────────────────────────────────────────────────

/**
 * Fisher–Yates shuffle (in-place).
 * @param {any[]} array
 * @returns {any[]} The same array, shuffled.
 */
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── Spec generation ──────────────────────────────────────────────────────

/**
 * Generate all trial specs (data only, no jsPsych objects yet).
 *
 * Probe indices are cycled within each condition so every item position
 * is probed equally often.
 *
 * @returns {object[]} Array of 320 trial specs.
 */
function generateExperimentalSpecs() {
  const specs = [];

  for (const condition of CONDITIONS) {
    const totalItems = condition.nPrimary + condition.nIntrude;

    for (let i = 0; i < condition.nTrials; i++) {
      const probeIndex = i % totalItems;
      specs.push(generateTrial(condition, probeIndex));
    }
  }

  return specs;
}

/**
 * Generate practice trial specs (1 per condition, random probe index).
 *
 * @returns {object[]} Array of 10 practice specs.
 */
function generatePracticeSpecs() {
  const specs = [];

  for (const condition of CONDITIONS) {
    const totalItems = condition.nPrimary + condition.nIntrude;
    const probeIndex = Math.floor(Math.random() * totalItems);
    specs.push(generateTrial(condition, probeIndex));
  }

  return specs;
}

// ── Assembly ─────────────────────────────────────────────────────────────

/**
 * Assemble the complete experiment: practice block + experimental mini-blocks.
 *
 * Each spec is expanded into a 4-phase trial sequence (fixation, sample,
 * retention, recall) via assembleTrialSequence.
 *
 * @param {number} [nBlocks=8]         Number of experimental mini-blocks.
 * @param {number} [trialsPerBlock=40] Trials per mini-block.
 * @returns {{ practice: object[], experimental: object[] }}
 *          Each array contains flat jsPsych trial objects (4 per spec).
 */
export function assembleExperiment(jsPsych, nBlocks = 8, trialsPerBlock = 40) {
  // Practice: 1 trial per condition, shuffled, blockID = 0
  const practiceSpecs = shuffle(generatePracticeSpecs());
  const practice = practiceSpecs.flatMap((spec, i) =>
    assembleTrialSequence(spec, i, 0, true, jsPsych)
  );

  // Experimental: generate all specs, shuffle, split into mini-blocks
  const experimentalSpecs = shuffle(generateExperimentalSpecs());
  const experimental = [];
  let trialID = 0;

  for (let block = 0; block < nBlocks; block++) {
    const blockSpecs = experimentalSpecs.slice(
      block * trialsPerBlock,
      (block + 1) * trialsPerBlock
    );

    for (const spec of blockSpecs) {
      experimental.push(...assembleTrialSequence(spec, trialID++, block + 1, false, jsPsych));
    }
  }

  return { practice, experimental };
}
