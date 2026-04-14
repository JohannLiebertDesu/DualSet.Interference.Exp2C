/**
 * Reusable trial templates for psychophysics trials.
 *
 * Every psychophysics trial in this experiment shares a common set of
 * settings (background color, canvas-trial CSS class, canvas offset fix).
 * This module provides a base template so those settings are defined once.
 */

import jsPsychPsychophysics from "@kurokida/jspsych-psychophysics";
import { Settings } from "../../ExperimentSettings.js";

/**
 * Create a psychophysics trial with the experiment's standard settings.
 *
 * Pass in the properties that vary per trial (stimuli, choices, duration, etc.)
 * and they will be merged on top of the shared defaults.
 *
 * @param {object} opts
 * @param {number} opts.trialID          Unique trial number within the experiment.
 * @param {number} opts.blockID          Block this trial belongs to.
 * @param {boolean} opts.practice        Whether this is a practice trial.
 * @param {number|null} opts.trial_duration  Trial duration in ms (null = wait for response).
 * @param {object} opts[...]             Any other jsPsych/psychophysics trial properties.
 */
export function makePsychophysicsTrial({ trialID, blockID, practice, ...overrides }) {
  const userOnFinish = overrides.on_finish;
  const stimuliRef = Array.isArray(overrides.stimuli) ? overrides.stimuli : null;

  return {
    type: jsPsychPsychophysics,
    background_color: Settings.display.trialBackgroundColor,
    css_classes: "canvas-trial",
    ...overrides,
    on_finish: (data) => {
      if (userOnFinish) userOnFinish(data);
      // Sever stim.instance → closure → ctx reference chain so the
      // detached canvas and its pixel buffer can be garbage-collected.
      // See docs/canvas-context-leak.md for the full explanation.
      if (stimuliRef) {
        for (const stim of stimuliRef) delete stim.instance;
      }
    },
    data: {
      trialID,
      blockID,
      practice,
      ...overrides.data,
    },
  };
}
