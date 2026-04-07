/**
 * Page 2 — Experiment guidelines.
 *
 * Informs participants about practical rules (no tab-switching, no distractions)
 * and what to expect after the experiment ends.
 *
 * EDIT the text below to match your study's specific requirements.
 * The Prolific-specific paragraphs toggle automatically via useProlific.
 *
 * @param {object} settings — the exported Settings object from ExperimentSettings.js
 * @returns {string} HTML string for the guidelines trial stimulus
 */
export function guidelinesPageHTML(settings) {
  const useProlific = settings.recruitment.useProlific;
  return `
    <div class="consent-form">
      <h1>Experiment Guidelines</h1>
      <p class="consent-lead">Please review these guidelines before starting.</p>

      <section class="consent-section">
        <h2>Before starting</h2>
        <ul>
          <li>Turn off any music, videos, or other media.</li>
          <li>Silence your phone and place it out of reach.</li>
          <li>Make sure you will not be disturbed for the duration of the experiment.</li>
        </ul>
      </section>

      <section class="consent-section">
        <h2>During the experiment</h2>
        <p>
          Do <strong>not</strong> leave this browser tab or switch to other
          windows during the experiment. Tab switches are monitored and the
          experiment will end automatically if you leave too many times.
          Do <strong>not</strong> reload this page — your progress cannot be
          restored.
        </p>
      </section>

      <section class="consent-section">
        <h2>After the experiment</h2>
        <p>
          ${useProlific
            ? `You will be automatically redirected to Prolific upon completion.
               Do not close your browser prematurely, as this may prevent your
               submission from being recorded.`
            : `Please do not close your browser until you see the completion
               message.`
          }
        </p>
      </section>

      <div class="consent-agreements">
        <label class="consent-checkbox">
          <input type="checkbox" class="consent-check" />
          <span>I understand and agree to follow the guidelines above${useProlific
            ? `, and I am aware that failing to do so may affect my compensation`
            : ``
          }.</span>
        </label>
      </div>
    </div>
  `;
}
