/**
 * Page 1 — Study information & informed consent.
 *
 * Presents all required ethics information and asks for explicit agreement
 * via checkboxes before the participant can proceed.
 *
 * All study-specific content is pulled from the Settings object
 * (ExperimentSettings.js) so researchers only need to edit one file.
 *
 * @param {object} settings — the exported Settings object from ExperimentSettings.js
 * @returns {string} HTML string for the consent trial stimulus
 */
export function consentPageHTML(settings) {
  const p = settings.recruitment.useProlific;

  return `
    <div class="consent-form">
      <h1>Study Information & Informed Consent</h1>
      <p class="consent-lead">Please read the following information carefully before deciding to participate.</p>

      <section class="consent-section">
        <h2>What this study is about</h2>
        <p>
          ${settings.study.description}
          ${settings.study.task}
          Your performance (e.g., choices, reaction times) will be recorded for
          scientific analysis. At the end, you may be asked some brief
          demographic questions.
        </p>
      </section>

      <section class="consent-section">
        <h2>Who can participate</h2>
        <p>${buildEligibilitySentence(settings.eligibility)}</p>
      </section>

      <section class="consent-section">
        <h2>Duration & compensation</h2>
        <p>
          This experiment takes approximately ${settings.study.duration} to complete.
          ${p
            ? `You will receive your compensation through Prolific as specified
               in the study listing.`
            : `Upon completion you will receive ${settings.study.compensation}.`
          }
        </p>
      </section>

      <section class="consent-section">
        <h2>Voluntary participation</h2>
        <p>
          Your participation is entirely <strong>voluntary</strong>. You may
          withdraw at any time without stating a reason by simply closing this
          browser window.
        </p>
      </section>

      <section class="consent-section">
        <h2>Risks</h2>
        <p>${settings.study.risks}</p>
      </section>

      <section class="consent-section">
        <h2>Confidentiality & data handling</h2>
        <p>
          Your anonymity will be preserved at all times. No personally
          identifiable information is stored permanently. Anonymised data may be
          published or shared in scientific repositories for transparency and
          reuse. Because data is fully anonymised, individual records cannot be
          traced back to participants and therefore cannot be deleted after
          collection.
        </p>
      </section>

      <p class="consent-contact">
        Questions? Contact ${settings.contact.name}
        (${settings.contact.email}), ${settings.contact.institution}.
      </p>

      <div class="consent-agreements">
        <label class="consent-checkbox">
          <input type="checkbox" class="consent-check" />
          <span>I have read and understood the study information above.</span>
        </label>
        <label class="consent-checkbox">
          <input type="checkbox" class="consent-check" />
          <span>I understand that my participation is voluntary and that I may withdraw at any time.</span>
        </label>
        <label class="consent-checkbox">
          <input type="checkbox" class="consent-check" />
          <span>I confirm that I am at least 18 years old and wish to participate.</span>
        </label>
        ${p
          ? `<label class="consent-checkbox">
               <input type="checkbox" class="consent-check" />
               <span>I confirm that I have truthfully completed Prolific's prescreening and meet all stated eligibility criteria.</span>
             </label>`
          : ``
        }
      </div>
    </div>
  `;
}

/**
 * Builds a natural-language eligibility sentence from the criteria flags.
 *
 * Examples:
 *   all true:              "English speakers aged 18–35 with normal or corrected-to-normal vision, not colour-blind."
 *   notColourBlind false:  "English speakers aged 18–35 with normal or corrected-to-normal vision."
 *   only english:          "English speakers."
 *   everything off:        "No specific eligibility requirements."
 */
function buildEligibilitySentence(eligibility) {
  const parts = [];

  if (eligibility.englishSpeaker) parts.push("English speakers");
  if (eligibility.ageRange) parts.push(`aged ${eligibility.ageRange}`);

  // Conditions that follow "with …" — add more here as needed.
  const conditions = [];
  if (eligibility.normalVision) conditions.push("normal or corrected-to-normal vision");
  if (eligibility.notColourBlind) conditions.push("not colour-blind");

  if (conditions.length > 0) {
    parts.push("with " + conditions.join(", "));
  }

  if (parts.length === 0) return "No specific eligibility requirements.";

  // Capitalise first letter and close with a period.
  let sentence = parts.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}
