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
        <p>
          In this experiment, we investigated how visual working memory handles
          different types of features — specifically, colours and orientations —
          when they appear on separate objects in a brief display.
        </p>
        <p>
          Previous research has debated whether memory for different feature
          dimensions (like colour and orientation) relies on shared or independent
          resources. Some studies found that adding items of one type does not
          interfere with memory for the other type, suggesting independence. Other
          studies found partial interference when features belong to spatially
          separated objects, suggesting some shared capacity.
        </p>
        <p>
          By varying the number and mix of colour and orientation items across
          trials, we aim to measure whether and how much cross-dimensional
          interference occurs in an online setting.
        </p>
      </section>

      <section class="consent-section">
        <h2>Why does this matter?</h2>
        <p>
          Understanding the structure of visual working memory helps us build
          more accurate models of how the mind organises and maintains
          information. These findings can inform clinical diagnostics — for
          example, detecting subtle cognitive changes in neurological conditions
          — as well as the design of visual displays and interfaces.
        </p>
      </section>

      <section class="consent-section">
        <h2>Further reading</h2>
        <ul>
          <li>Wang, B., Cao, X., Theeuwes, J., Olivers, C. N., & Wang, Z. (2017). Separate capacities for storing different features in visual working memory. <em>Journal of Experimental Psychology: Learning, Memory, and Cognition, 43</em>(2), 226–236.</li>
          <li>Markov, Y. A., Tiurina, N. A., & Utochkin, I. S. (2019). Different features are stored independently in visual working memory but mediated by object-based representations. <em>Acta Psychologica, 197</em>, 52–63.</li>
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
