/**
 * Experiment instructions — multi-page with back/next navigation.
 *
 * Uses @jspsych/plugin-instructions which provides built-in back/next buttons
 * and page tracking. Each page is an HTML string.
 *
 * LAYOUT CLASSES (defined in styles/common.css):
 *
 *   .instructions-page          — base container, centred, max-width constrained
 *   .instructions-page.text-left — left-aligned text variant for longer paragraphs
 *   img.instructions-slide      — full-page image (PPTX/GIF), fills up to 65vh
 *   img.instructions-figure     — smaller image for mixing with text, up to 40vh
 *   .instructions-caption       — muted caption text below an image
 *
 * IMAGES:
 *   Place instruction images in public/assets/instructions/ and reference them
 *   as "assets/instructions/filename.gif" (no leading slash). Vite copies them
 *   into dist/ on build. Preload them in main.js's PreloadPlugin if needed.
 *
 * @returns {object} A jsPsych trial configuration for the instructions plugin
 */
import InstructionsPlugin from "@jspsych/plugin-instructions";

export function makeInstructions() {
  return {
    type: InstructionsPlugin,
    pages: [

      // ── Page 1: Text-only introduction ──
      `<div class="instructions-page">
        <h2>Welcome to the Experiment</h2>
        <p>
          In this experiment you will [brief overview of the task].
          Please read these instructions carefully.
        </p>
      </div>`,

      // ── Page 2: Full-page slide image ──
      // Uncomment and replace the src with your actual slide path.
      // `<div class="instructions-page">
      //   <img class="instructions-slide" src="assets/instructions/slide1.gif" alt="Instructions slide 1" />
      // </div>`,

      // ── Page 3: Image with text above/below ──
      // `<div class="instructions-page">
      //   <p>On each trial you will see the following display:</p>
      //   <img class="instructions-figure" src="assets/instructions/example-trial.png" alt="Example trial" />
      //   <p class="instructions-caption">Example of a single trial.</p>
      //   <p>Your task is to [describe what to do].</p>
      // </div>`,

      // ── Page 4: Text-only, left-aligned ──
      `<div class="instructions-page text-left">
        <h2>Key Rules</h2>
        <p>
          Please keep the following in mind:
        </p>
        <ul>
          <li>[Rule 1 — e.g., respond as quickly and accurately as possible.]</li>
          <li>[Rule 2 — e.g., keep your eyes on the fixation cross.]</li>
          <li>[Rule 3 — e.g., use only the specified keys.]</li>
        </ul>
      </div>`,

      // ── Final page ──
      `<div class="instructions-page">
        <h2>Ready?</h2>
        <p>
          If you have any questions, please re-read the instructions using the
          "Previous" button. Otherwise, press "Next" to begin.
        </p>
      </div>`,

    ],
    show_clickable_nav: true,
    allow_backward: true,
    button_label_previous: "Previous",
    button_label_next: "Next",
  };
}
