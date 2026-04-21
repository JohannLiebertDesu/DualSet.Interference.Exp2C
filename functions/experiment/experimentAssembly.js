/**
 * Experiment assembly — builds the full timeline for an Exp2B replication.
 *
 * ── Structure (per participant) ───────────────────────────────────────────
 *
 *   Two major blocks (Combined and Split), order set by the between-subject
 *   condition label passed in (see Settings.recruitment.conditions).
 *
 *   For each major block:
 *     - Pre-practice break screen   (describes the block)
 *     - Practice mini-block          (12 trials, feedback after each probe)
 *     - Post-practice break screen
 *     - 3 × main mini-blocks of 32 trials
 *         - Between-mini-block break after mini-blocks 1 and 2
 *     - Between-major-block break    (except after the second major block)
 *
 * The order of trials within each mini-block is shuffled.
 *
 * ── Trial totals ──────────────────────────────────────────────────────────
 *
 *   Practice per block:  12
 *   Main per block:      96   (3 × 32)
 *   Total main:         192   (across 2 major blocks)
 *   Total practice:      24
 */

import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import { makeBreakTrial } from "../global/breakScreen.js";
import {
  generateTrial,
  parseCondition,
  makeMainSetSizes,
  makePracticeSetSizes,
  MAIN_MINIBLOCKS_PER_BLOCK,
} from "./experimentDesign.js";
import { assembleTrialSequence } from "./trialAssembly.js";

// ── Fisher–Yates shuffle (in-place) ───────────────────────────────────────
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ── Per-block break screens ──────────────────────────────────────────────

function describeBlockType(blockType) {
  if (blockType === "Combined") {
    return "In this block, you will see oriented triangles. Sometimes you will see 3 triangles at once, and sometimes 6 at once.";
  }
  return "In this block, you will first see 3 oriented triangles on the left side of the screen, then 3 on the right side.";
}

function describeProbeOrder(blockType) {
  if (blockType === "Combined") {
    return "After the display, you will be asked to reproduce the orientations of two of the triangles. Which triangles are tested is random.";
  }
  // Split is always ABBA in Exp2C.
  return "After the display, you will reproduce two orientations in a fixed order: first one from the right side of the screen, then one from the left side.";
}

function makePrePracticeScreen(blockIndex, totalBlocks, blockType, nPracticeTrials) {
  return {
    type: HtmlButtonResponsePlugin,
    stimulus: `
      <div class="instructions-page text-left">
        <h2>Block ${blockIndex} of ${totalBlocks}</h2>
        <p>${describeBlockType(blockType)}</p>
        <p>${describeProbeOrder(blockType)}</p>
        <p>We will start with <strong>${nPracticeTrials} practice trials</strong>. After each response you will see how close you were to the correct answer.</p>
        <p>Click the button when you're ready to begin.</p>
      </div>
    `,
    choices: ["Start practice"],
    post_trial_gap: 1000,
    data: { phase: "pre_practice", blockID: blockIndex, blockType },
  };
}

function makePostPracticeScreen(blockIndex, totalBlocks) {
  return {
    type: HtmlButtonResponsePlugin,
    stimulus: `
      <div class="instructions-page">
        <h2>Ready for the main trials</h2>
        <p>Great — you've finished the practice for block <strong>${blockIndex}</strong> of <strong>${totalBlocks}</strong>. From now on you won't receive feedback after each trial.</p>
        <p>Click the button when you're ready to continue.</p>
      </div>
    `,
    choices: ["Start main trials"],
    post_trial_gap: 1000,
    data: { phase: "post_practice", blockID: blockIndex },
  };
}

function makeBetweenMiniBlockScreen(blockIndex, miniIndex, totalMini) {
  return {
    type: HtmlButtonResponsePlugin,
    stimulus: `
      <div class="instructions-page">
        <h2>Short break</h2>
        <p>You've completed mini-block <strong>${miniIndex}</strong> of <strong>${totalMini}</strong> in block ${blockIndex}.</p>
        <p>Take a few seconds to rest before continuing.</p>
      </div>
    `,
    choices: ["Continue"],
    enable_button_after: 3000,
    data: { phase: "between_mini_block", blockID: blockIndex, miniIndex },
  };
}

// ── Trial generation ─────────────────────────────────────────────────────

function specsFromSetSizes(setSizes, blockType) {
  return shuffle(setSizes).map((numItems) =>
    generateTrial({ blockType, numItems })
  );
}

// ── Main assembly ────────────────────────────────────────────────────────

/**
 * Build the full experiment timeline for a given between-subject condition.
 *
 * @param {object} jsPsych
 * @param {string} conditionLabel   One of Settings.recruitment.conditions,
 *                                   either "CS" or "SC". See experimentDesign.js.
 * @returns {object[]}  jsPsych trial objects (ready to push onto the timeline).
 */
export function assembleExperiment(jsPsych, conditionLabel) {
  const { blockOrder } = parseCondition(conditionLabel);
  const blockTypes = blockOrder === "CS" ? ["Combined", "Split"] : ["Split", "Combined"];
  const totalBlocks = blockTypes.length;

  const timeline = [];
  let trialID = 0;

  blockTypes.forEach((blockType, blockIdx) => {
    const blockIndex = blockIdx + 1;

    // ── Pre-practice ──
    const practiceSetSizes = makePracticeSetSizes(blockType);
    timeline.push(
      makePrePracticeScreen(blockIndex, totalBlocks, blockType, practiceSetSizes.length)
    );

    // ── Practice mini-block ──
    const practiceSpecs = specsFromSetSizes(practiceSetSizes, blockType);
    for (const spec of practiceSpecs) {
      timeline.push(...assembleTrialSequence(spec, trialID++, 0, true, jsPsych));
    }

    // ── Post-practice ──
    timeline.push(makePostPracticeScreen(blockIndex, totalBlocks));

    // ── Main mini-blocks ──
    for (let mini = 0; mini < MAIN_MINIBLOCKS_PER_BLOCK; mini++) {
      const mainSpecs = specsFromSetSizes(makeMainSetSizes(blockType), blockType);
      for (const spec of mainSpecs) {
        timeline.push(...assembleTrialSequence(spec, trialID++, blockIndex, false, jsPsych));
      }
      if (mini < MAIN_MINIBLOCKS_PER_BLOCK - 1) {
        timeline.push(
          makeBetweenMiniBlockScreen(blockIndex, mini + 1, MAIN_MINIBLOCKS_PER_BLOCK)
        );
      }
    }

    // ── Between major blocks ──
    if (blockIdx < totalBlocks - 1) {
      timeline.push(makeBreakTrial(blockIndex, totalBlocks, jsPsych));
    }
  });

  return timeline;
}
