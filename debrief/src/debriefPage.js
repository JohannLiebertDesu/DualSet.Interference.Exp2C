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
        <p>
          We're studying how two sets of information can affect each other
          when you try to remember them at the same time. This helps us
          understand how memory works when you need to handle a lot of
          information quickly.
        </p>
        <p>
          More specifically, we wanted to find out whether remembering six
          items presented simultaneously is as hard as remembering three
          items twice.
        </p>
        <p>
          Your participation helps us learn more about how memory works and
          what factors make it easier or harder to remember things.
        </p>
      </section>

      <section class="consent-section">
        <h2>Literature</h2>
        <ul>
          <li>Cocchini, G., Logie, R. H., Della Sala, S., MacPherson, S. E., &amp; Baddeley, A. D. (2002). Concurrent performance of two memory tasks: Evidence for domain-specific working memory systems. <em>Memory &amp; Cognition, 30</em>(7), 1086–1095. <a href="https://doi.org/10.3758/bf03194326">https://doi.org/10.3758/bf03194326</a></li>
          <li>Markov, Y. A., Tiurina, N. A., &amp; Utochkin, I. S. (2019). Different features are stored independently in visual working memory but mediated by object-based representations. <em>Acta Psychologica, 197</em>, 52–63. <a href="https://doi.org/10.1016/j.actpsy.2019.05.003">https://doi.org/10.1016/j.actpsy.2019.05.003</a></li>
          <li>Oberauer, K., &amp; Kliegl, R. (2004). Simultaneous cognitive operations in working memory after dual-task practice. <em>Journal of Experimental Psychology: Human Perception and Performance, 30</em>(4), 689–707. <a href="https://doi.org/10.1037/0096-1523.30.4.689">https://doi.org/10.1037/0096-1523.30.4.689</a></li>
          <li>Uittenhove, K., Chaabi, L., Camos, V., &amp; Barrouillet, P. (2019). Is working memory storage intrinsically domain-specific? <em>Journal of Experimental Psychology: General, 148</em>(11), 2027–2057. <a href="https://doi.org/10.1037/xge0000566">https://doi.org/10.1037/xge0000566</a></li>
          <li>Wang, B., Cao, X., Theeuwes, J., Olivers, C. N. L., &amp; Wang, Z. (2017). Separate capacities for storing different features in visual working memory. <em>Journal of Experimental Psychology: Learning, Memory, and Cognition, 43</em>(2), 226–236. <a href="https://doi.org/10.1037/xlm0000295">https://doi.org/10.1037/xlm0000295</a></li>
          <li>Zhang, J., Ye, C., Sun, H., Zhou, J., Liang, T., Li, Y., &amp; Liu, Q. (2022). The passive state: A protective mechanism for information in working memory tasks. <em>Journal of Experimental Psychology: Learning, Memory, and Cognition, 48</em>(9), 1235–1248. <a href="https://doi.org/10.1037/xlm0001092">https://doi.org/10.1037/xlm0001092</a></li>
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
