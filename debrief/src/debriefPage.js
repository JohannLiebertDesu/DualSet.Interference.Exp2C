/**
 * Debrief page — explains the study purpose and provides researcher contact.
 *
 * Shown after the questionnaire. This is where you explain what the study
 * was actually about, especially if any deception or incomplete disclosure
 * was involved in the consent.
 *
 * EDIT the text below to match your study. Contact info is pulled from Settings.
 *
 * @param {object} settings — the exported Settings object from ExperimentSettings.js
 * @returns {string} HTML string for the debrief trial stimulus
 */
export function debriefPageHTML(settings) {
  return `
    <div class="consent-form">
      <h1>Debriefing</h1>
      <p class="consent-lead">Thank you for your participation. Here is some more information about this study.</p>

      <section class="consent-section">
        <h2>What was this study about?</h2>
        <!-- EDIT: Add study-specific details (e.g., hypotheses, manipulations)
             to the general description below. If you used deception or withheld
             information during consent, this is where you disclose it. -->
        <p>
          This experiment is part of ongoing research in cognitive psychology.
          We are interested in understanding how human perception and memory
          work — how people take in, store, and retrieve information, and how
          individuals differ from one another in these abilities. To study this
          reliably, we need large amounts of behavioural data from many
          participants, which is why your contribution is valuable.
        </p>
      </section>

      <section class="consent-section">
        <h2>Why does this matter?</h2>
        <p>
          Beyond advancing our general understanding of the mind, findings from
          research like this are used in clinical diagnostics and interventions
          — for example, to detect and track cognitive changes in neurological
          conditions. They also inform the evaluation of competence and aptitude
          for different jobs and skills, helping to develop fairer and more
          accurate assessments.
        </p>
      </section>

      <section class="consent-section">
        <h2>Further reading</h2>
        <!-- EDIT: Add relevant references, or remove this section if not needed. -->
        <ul>
          <li>[Author et al. (Year). Title. <em>Journal</em>. <a href="#">https://doi.org/...</a>]</li>
        </ul>
      </section>

      <p class="consent-contact">
        If you have any remaining questions about this study, please contact
        ${settings.contact.name} at
        <a href="mailto:${settings.contact.email}">${settings.contact.email}</a>,
        ${settings.contact.institution}.
      </p>
    </div>
  `;
}
