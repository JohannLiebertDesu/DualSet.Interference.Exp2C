/**
 * Tracks how many times the participant leaves the browser tab (blur events).
 *
 * Created before initJsPsych (because the handler must be passed as a config
 * option), then wired up to the jsPsych instance via init(). Monitoring only
 * starts after activate() is called — typically by the screen check on success —
 * so blurs during setup screens (fullscreen prompt, etc.) don't count.
 *
 * Warning overlay: pauses the experiment, shows how many chances remain.
 * Final violation: stamps "failed_attention_check" on the data and ends the experiment.
 *
 * @param {object} settings - ExperimentSettings (needs maxBlurs)
 * @returns {{ handler: Function, activate: Function, init: Function }}
 */
export function createBlurMonitor(settings) {
  // No-op monitor when tracking is disabled.
  if (settings.maxBlurs === null) {
    return { handler() {}, activate() {}, init() {} };
  }

  let jsPsych = null;
  let active = false;
  let blurCount = 0;
  const maxBlurs = settings.maxBlurs;

  /**
   * Shows a warning overlay that pauses the experiment until dismissed.
   * Styled via .template-overlay classes defined in styles/common.css.
   */
  function showWarningOverlay(message, onDismiss) {
    const overlay = document.createElement("div");
    overlay.className = "template-overlay template-overlay--warning";
    overlay.innerHTML = `
      <div class="template-overlay-card">
        <h2>Warning</h2>
        <p>${message}</p>
        <button class="overlay-btn">Continue</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector(".overlay-btn").addEventListener("click", () => {
      overlay.remove();
      onDismiss();
    });
  }

  /**
   * The on_interaction_data_update callback passed to initJsPsych.
   */
  function handler(data) {
    if (!active || !jsPsych || data.event !== "blur") return;

    blurCount++;

    if (blurCount >= maxBlurs) {
      // Final violation — abort the experiment.
      // jsPsych 8 renamed endExperiment() → abortExperiment().
      active = false;
      jsPsych.data.addProperties({
        experiment_status: "failed_attention_check",
        blur_count: blurCount,
      });
      // Exit fullscreen first so the participant isn't stuck in a blank fullscreen window.
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      jsPsych.abortExperiment(
        `<div class="abort-message">
           <h2 class="abort-message-title">Experiment Ended</h2>
           <p>Unfortunately, you have left the browser tab too many times.</p>
           <p>The experiment must end. <strong>Your data has been recorded.</strong></p>
         </div>`
      );
    } else {
      // Warning — pause and let them continue.
      jsPsych.pauseExperiment();
      const remaining = maxBlurs - blurCount;
      showWarningOverlay(
        `You have left the browser tab <strong>${blurCount}</strong> time(s).
         You have <strong>${remaining}</strong> chance(s) remaining before the experiment ends.`,
        () => jsPsych.resumeExperiment()
      );
    }
  }

  return {
    handler,
    /** Start counting blurs (call after setup screens are done). */
    activate() { active = true; },
    /** Provide the jsPsych instance once it exists. */
    init(jspsychInstance) { jsPsych = jspsychInstance; },
  };
}
