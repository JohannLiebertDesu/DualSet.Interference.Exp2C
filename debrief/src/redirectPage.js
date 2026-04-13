/**
 * Prolific redirect countdown page.
 *
 * Shown as the final trial when useProlific is true. The moment this page
 * appears, all JATOS housekeeping (data submission, completions counter) is
 * fired off immediately — so even if the participant closes the browser during
 * the countdown, data is already safely submitted.
 *
 * After the countdown finishes, the trial ends and jsPsych's on_finish calls
 * jatos.endStudy(), which triggers the redirect to Prolific via the study's
 * endRedirectUrl configured in JATOS.
 *
 * @param {object} jsPsych - The active jsPsych instance (needed to read data)
 * @returns {object} A jsPsych trial configuration
 */
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";

const COUNTDOWN_SECONDS = 5;

export function makeRedirectTrial(jsPsych) {
  return {
    type: HtmlKeyboardResponsePlugin,
    choices: "NO_KEYS",
    trial_duration: (COUNTDOWN_SECONDS + 1) * 1000,
    stimulus: `
      <div class="consent-form" style="text-align: center;">
        <h1>Thank You!</h1>
        <p>Your data has been saved.</p>
        <p>You will be redirected to Prolific in <strong id="countdown">${COUNTDOWN_SECONDS}</strong> seconds.</p>
        <p style="color: #999; font-size: 0.85em;">Please do not close this window.</p>
        <p id="fallback-code" style="display: none; color: #999; font-size: 0.85em; margin-top: 1.5em;">
          If you are not redirected automatically, enter this code on Prolific:
          <strong style="color: #2c2c2c;">C17L614H</strong>
        </p>
      </div>
    `,
    on_load: () => {
      // ── Immediately wrap up JATOS while the countdown is visible ──
      // Submit data now (fire-and-forget) so it's saved even if the browser
      // closes during the countdown. endStudy() in on_finish acts as backup.
      if (typeof window.jatos !== "undefined") {
        const resultJson = jsPsych.data.get().json();

        // Submit result data for this component immediately.
        window.jatos.submitResultData(resultJson);

        // Increment the batch-level completion counter.
        (async () => {
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const n = window.jatos.batchSession.get("completions") ?? 0;
              await window.jatos.batchSession.add("/completions", n + 1);
              break;
            } catch (_) {
              // Version conflict — retry once, then give up silently.
            }
          }
        })();
      }

      // ── Visual countdown ──
      const el = document.getElementById("countdown");
      let remaining = COUNTDOWN_SECONDS;
      const interval = setInterval(() => {
        remaining--;
        if (el) el.textContent = remaining;
        if (remaining <= 0) {
          clearInterval(interval);
          const fallback = document.getElementById("fallback-code");
          if (fallback) fallback.style.display = "block";
        }
      }, 1000);
    },
  };
}
