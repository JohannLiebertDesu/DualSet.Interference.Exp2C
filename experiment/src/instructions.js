/**
 * Experiment instructions — multi-page with back/next navigation.
 *
 * Covers the task at a high level. Per-block specifics (Combined vs Split
 * presentation format) are shown on the pre-practice screen that
 * experimentAssembly.js inserts before each block's practice mini-block.
 *
 * LAYOUT CLASSES (defined in styles/common.css):
 *   .instructions-page           — base container, centred, max-width constrained
 *   .instructions-page.text-left — left-aligned variant for longer paragraphs
 *
 * IMAGES:
 *   Place instruction images in public/assets/ and reference them as
 *   "assets/filename.ext" (no leading slash). Preload them in main.js.
 */

import InstructionsPlugin from "@jspsych/plugin-instructions";

export function makeInstructions() {
  return {
    type: InstructionsPlugin,
    pages: [

      // ── Page 1: Welcome ──
      `<div class="instructions-page">
        <h2>Welcome</h2>
        <p>
          In this experiment you will be asked to remember the orientations of
          briefly presented triangles and then reproduce them from memory.
          Please read these instructions carefully.
        </p>
      </div>`,

      // ── Page 2: Stimulus + trial sequence ──
      `<div class="instructions-page text-left" style="display: flex; flex-direction: row; gap: 2rem; align-items: center; max-width: 1500px;">
        <div style="flex: 1;">
          <h2>What you will see</h2>
          <p>
            On each trial, a set of <strong>oriented triangles</strong> will briefly
            appear on screen. Each triangle points in a particular direction.
            Your task is to remember all of them.
          </p>
          <p>Each trial follows the same general sequence:</p>
          <ol>
            <li>The triangles appear <strong>briefly</strong>. Try to remember their orientations.</li>
            <li>The screen goes blank for a short delay.</li>
            <li>A <strong>response wheel</strong> appears at the location of one of the triangles.</li>
          </ol>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.3rem; align-items: center;">
          <p style="margin: 0; font-weight: bold;">1. Stimulus display</p>
          <img src="assets/Combined6.png" alt="Stimulus display — oriented triangles" style="max-height: 18vh; border-radius: 6px;" />
          <p style="margin: 0.3rem 0 0; font-weight: bold;">2. Blank delay</p>
          <img src="assets/Blank.png" alt="Blank retention interval" style="max-height: 18vh; border-radius: 6px;" />
          <p style="margin: 0.3rem 0 0; font-weight: bold;">3. Response wheel</p>
          <img src="assets/ResponseWheelEmpty1.png" alt="Empty orientation response wheel" style="max-height: 18vh; border-radius: 6px;" />
        </div>
      </div>`,

      // ── Page 3: How to respond ──
      `<div class="instructions-page text-left" style="display: flex; flex-direction: row; gap: 2rem; align-items: center; max-width: 1500px;">
        <div style="flex: 1;">
          <h2>How to respond</h2>
          <p>
            Two of the triangles will be tested on each trial. For each test, a
            black wheel appears at the location where a triangle had been.
          </p>
          <ol>
            <li><strong>Click once</strong> on the wheel to make your initial response. A triangle preview appears pointing in the direction you clicked.</li>
            <li><strong>Move the mouse</strong> to adjust the triangle's orientation. The preview updates in real time.</li>
            <li><strong>Click again</strong> to confirm your response.</li>
          </ol>
          <p>
            Once you confirm the first response, a second wheel appears at another triangle's location. Accuracy matters more than speed — there is no time limit on your responses.
          </p>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.3rem; align-items: center;">
          <p style="margin: 0; font-weight: bold;">1st probe — wheel appears</p>
          <img src="assets/ResponseWheelEmpty1.png" alt="First empty response wheel" style="max-height: 14vh; border-radius: 6px;" />
          <p style="margin: 0.3rem 0 0; font-weight: bold;">1st probe — your response</p>
          <img src="assets/ResponseWheelFilled1.png" alt="First response wheel with triangle response" style="max-height: 14vh; border-radius: 6px;" />
          <p style="margin: 0.3rem 0 0; font-weight: bold;">2nd probe — wheel appears</p>
          <img src="assets/ResponseWheelEmpty2.png" alt="Second empty response wheel" style="max-height: 14vh; border-radius: 6px;" />
          <p style="margin: 0.3rem 0 0; font-weight: bold;">2nd probe — your response</p>
          <img src="assets/ResponseWheelFilled2.png" alt="Second response wheel with triangle response" style="max-height: 14vh; border-radius: 6px;" />
        </div>
      </div>`,

      // ── Page 4: Two block types ──
      `<div class="instructions-page text-left">
        <h2>Two kinds of blocks</h2>
        <p>
          The experiment has <strong>two blocks</strong>. They differ in how the triangles are
          shown:
        </p>
        <ul>
          <li>
            <strong>Combined block</strong> — All triangles appear at the same time.
            Sometimes you will see 3 triangles, sometimes 6.
          </li>
          <li>
            <strong>Split block</strong> — You will first see 3 triangles on the <em>left</em>
            side of the screen, then (after a brief blank) 3 more on the <em>right</em> side.
          </li>
        </ul>
        <p>
          You will receive more specific instructions at the start of each block.
        </p>
      </div>`,

      // ── Page 5: Important notes ──
      `<div class="instructions-page text-left">
        <h2>Important</h2>
        <ul>
          <li>The triangles appear only <strong>very briefly</strong> — try to stay focused.</li>
          <li>Please do <strong>not</strong> leave the browser tab during the experiment.</li>
          <li>Each block starts with a short <strong>practice mini-block</strong>,
              followed by several mini-blocks of main trials with breaks in between.</li>
        </ul>
      </div>`,

      // ── Page 6: Continue ──
      `<div class="instructions-page">
        <h2>Ready to start</h2>
        <p>
          If you have any questions, use the "Previous" button to re-read the
          instructions. Otherwise, press "Next" to begin the first block.
        </p>
      </div>`,

    ],
    css_classes: "wide-content",
    show_clickable_nav: true,
    allow_backward: true,
    button_label_previous: "Previous",
    button_label_next: "Next",
  };
}
