/**
 * Post-experiment questionnaire — SurveyJS JSON config.
 *
 * Uses @jspsych/plugin-survey which wraps SurveyJS. Each element's `name`
 * becomes a key in the trial's `response` data object, so keep names
 * analysis-friendly (lowercase, underscored).
 *
 * EDIT the questions below to match your study. The SurveyJS docs cover all
 * available question types: https://surveyjs.io/form-library/documentation
 *
 * Common types: text, comment (textarea), radiogroup, dropdown, rating, boolean, html
 *
 * @returns {object} A SurveyJS-compatible JSON object with pages and elements
 */
export function questionnaireSurveyJSON() {
  return {
    // Show question numbers across all pages (1, 2, 3…)
    showQuestionNumbers: "on",
    // Require all required questions before allowing submission
    checkErrorsMode: "onValueChanged",

    pages: [
      {
        name: "post_experiment",
        elements: [
          {
            type: "html",
            html: `
              <h2 class="questionnaire-title">Post-Experiment Questionnaire</h2>
              <p class="questionnaire-lead">
                These questions are for data quality purposes only and have
                <strong>no effect on your compensation</strong>. Please answer honestly.
              </p>
            `,
          },

          // ── Demographics ──────────────────────────────────────────────
          {
            type: "text",
            name: "age",
            title: "How old are you?",
            inputType: "number",
            isRequired: true,
            min: 18,
            max: 99,
          },
          {
            type: "dropdown",
            name: "gender",
            title: "What is your gender?",
            choices: ["Man", "Woman", "Non-binary", "Prefer not to say"],
            showOtherItem: true,
            otherText: "Other (please specify)",
            isRequired: true,
          },

          // ── Task experience ───────────────────────────────────────────
          // EDIT: Adjust or remove these to fit your study.
          {
            type: "comment",
            name: "strategy",
            title: "Did you use any particular strategy during the experiment?",
            isRequired: false,
            rows: 3,
            placeholder: "Describe any strategies you used, or leave blank.",
          },
          {
            type: "rating",
            name: "effort",
            title: "How much effort did you put into the task? (This does not affect your compensation.)",
            rateCount: 5,
            rateMin: 1,
            rateMax: 5,
            minRateDescription: "None at all",
            maxRateDescription: "A great deal",
            isRequired: true,
          },
          {
            type: "rating",
            name: "distraction",
            title: "How distracted were you during the experiment? (This does not affect your compensation.)",
            rateCount: 5,
            rateMin: 1,
            rateMax: 5,
            minRateDescription: "Not at all",
            maxRateDescription: "Extremely",
            isRequired: true,
          },

          // ── Technical ─────────────────────────────────────────────────
          {
            type: "boolean",
            name: "technical_issues",
            title: "Did you experience any technical issues during the experiment?",
            isRequired: true,
            labelTrue: "Yes",
            labelFalse: "No",
          },
          {
            type: "comment",
            name: "technical_details",
            title: "Please describe the technical issue(s):",
            // Only visible if the participant reported technical issues.
            visibleIf: "{technical_issues} = true",
            isRequired: false,
            rows: 2,
          },

          // ── Open feedback ─────────────────────────────────────────────
          {
            type: "comment",
            name: "comments",
            title: "Any other comments or feedback about the experiment?",
            isRequired: false,
            rows: 3,
          },
        ],
      },
    ],
  };
}
