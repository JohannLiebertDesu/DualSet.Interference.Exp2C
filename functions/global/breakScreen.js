/**
 * Generates a break screen trial to insert between experiment blocks.
 *
 * Shows block progress (visual bar + text), a brief encouragement to rest,
 * and a "Continue" button that is disabled for a few seconds to ensure the
 * participant actually pauses before resuming.
 *
 * When running inside JATOS, the break screen also ships all data collected
 * so far to the server (via appendResultData) so that completed blocks are
 * safe even if the browser crashes later. A status property is added to the
 * data marking which blocks have been completed.
 *
 * Usage in your timeline:
 *   import { makeBreakTrial } from "../../functions/global/breakScreen.js";
 *
 *   for (let i = 0; i < totalBlocks; i++) {
 *     timeline.push(blockTrials[i]);
 *     if (i < totalBlocks - 1) {
 *       timeline.push(makeBreakTrial(i + 1, totalBlocks, jsPsych));
 *     }
 *   }
 *
 * @param {number} completedBlocks - How many blocks have been completed (1-indexed)
 * @param {number} totalBlocks     - Total number of blocks in the experiment
 * @param {object} jsPsych         - The active jsPsych instance (needed to read data)
 * @param {object} [options]       - Optional overrides
 * @param {number} [options.minBreakMs=5000] - Minimum ms before the button becomes clickable
 * @returns {object} A jsPsych trial configuration (html-button-response)
 */
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";

export function makeBreakTrial(completedBlocks, totalBlocks, jsPsych, options = {}) {
  const minBreakMs = options.minBreakMs ?? 5000;
  const pct = Math.round((completedBlocks / totalBlocks) * 100);

  return {
    type: HtmlButtonResponsePlugin,
    stimulus: `
      <div class="break-screen">
        <h2 class="break-screen-title">Break</h2>
        <p>You have completed <strong>${completedBlocks}</strong> of <strong>${totalBlocks}</strong> blocks.</p>

        <div class="break-progress-track">
          <div class="break-progress-fill" style="width: ${pct}%"></div>
        </div>

        <p class="break-screen-hint">
          Take a moment to rest your eyes — look away from the screen for a few
          seconds, take a breath, then continue when you're ready.
        </p>
      </div>
    `,
    choices: ["Continue"],
    // Enforce a minimum pause before the button becomes clickable.
    enable_button_after: minBreakMs,
    // Save data to JATOS as soon as the break screen appears, so completed
    // blocks are safe even if the browser crashes during a later block.
    on_load: () => {
      if (typeof window.jatos !== "undefined") {
        const status = `blocks_completed_1-${completedBlocks}_of_${totalBlocks}`;
        // Add a progress marker to the data so partial submissions are identifiable.
        jsPsych.data.addProperties({ save_status: status });
        // Ship everything collected so far. submitResultData OVERWRITES (not appends)
        // the component's result data on the JATOS server, so each break saves a
        // complete snapshot without duplication. The final startNextComponent() call
        // at the end of the experiment overwrites this with the full dataset.
        window.jatos.submitResultData(jsPsych.data.get().json());
      }

    },
  };
}
