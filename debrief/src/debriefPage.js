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
          We are studying how visual working memory handles items that are
          presented either all at once or as two separate sets. In one block
          you saw all the triangles together; in the other you saw three on
          the left first, then three on the right. Comparing these formats
          tells us whether memory treats six items as a single pool or as
          two separable groups — a question known as
          <em>dual-set interference</em>.
        </p>
      </section>

      <section class="consent-section">
        <h2>Why does this matter?</h2>
        <p>
          Visual working memory is central to everyday tasks like following
          a conversation or keeping track of what you see. Understanding how
          its capacity is organised helps refine psychological theories of
          memory and informs applied work on display design and clinical
          assessment.
        </p>
      </section>

      <section class="consent-section">
        <h2>Further reading</h2>
        <ul>
          <li>Oberauer, K., &amp; Lin, H.-Y. (2017). An interference model of visual working memory. <em>Psychological Review, 124</em>(1), 21–59.</li>
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
