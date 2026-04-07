/**
 * Creates a browser-check trial that verifies screen dimensions after fullscreen.
 *
 * Placed right after the fullscreen trial in the timeline. If the participant's
 * screen is smaller than the configured minimums (phone, small tablet, or
 * fullscreen failed), the experiment ends immediately with "failed_resize".
 *
 * On success, activates the blur monitor so tab-leave tracking begins only
 * once the real experiment trials start.
 *
 * @param {object} jsPsych   - The active jsPsych instance
 * @param {object} settings  - ExperimentSettings (needs minScreenWidth, minScreenHeight)
 * @param {object} blurMonitor - The blur monitor object (needs .activate())
 * @returns {object} A jsPsych trial configuration
 */
import BrowserCheckPlugin from "@jspsych/plugin-browser-check";

export function makeScreenCheck(jsPsych, settings, blurMonitor) {
  return {
    type: BrowserCheckPlugin,
    on_finish: (data) => {
      if (
        data.width < settings.minScreenWidth ||
        data.height < settings.minScreenHeight
      ) {
        jsPsych.data.addProperties({ experiment_status: "failed_resize" });
        // jsPsych 8 renamed endExperiment() → abortExperiment().
        // Exit fullscreen first so the participant sees the message in a normal window.
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        jsPsych.abortExperiment(
          `<div class="abort-message">
             <h2 class="abort-message-title">Screen Too Small</h2>
             <p>Your screen does not meet the minimum size requirements for this experiment.</p>
             <p>Please use a <strong>desktop or laptop computer</strong> with a larger screen.</p>
           </div>`
        );
      } else {
        // Screen is fine — start monitoring tab switches from here on.
        blurMonitor.activate();
      }
    },
  };
}
