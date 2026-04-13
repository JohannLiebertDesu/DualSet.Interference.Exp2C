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
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";

export function makeInstructions() {
  return {
    type: InstructionsPlugin,
    pages: [

      // ── Page 1: Welcome ──
      `<div class="instructions-page">
        <h2>Welcome</h2>
        <p>
          In this experiment, you will be asked to remember visual items and
          report one of them from memory. Please read these instructions carefully.
        </p>
      </div>`,

      // ── Page 2: The stimuli (text + two example images side by side) ──
      `<div class="instructions-page text-left" style="display: flex; flex-direction: row; gap: 2rem; align-items: center; max-width: 1500px;">
        <div style="flex: 1;">
          <h2>What You Will See</h2>
          <p>
            On each trial, a set of items will briefly appear around a central
            fixation cross. There are two types of items:
          </p>
          <ul>
            <li><strong>Oriented triangles</strong> — grey triangles pointing in different directions.</li>
            <li><strong>Coloured patches</strong> — small patches of different colours.</li>
          </ul>
          <p>
            Some trials will show only one type, while others will show a mix of both.
          </p>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
          <p style="margin: 0; font-weight: bold;">Example 1</p>
          <img src="assets/3_ExampleStimuli.png" alt="Example stimulus display 1" style="max-height: 30vh; border-radius: 6px;" />
          <p style="margin: 0.5rem 0 0; font-weight: bold;">Example 2</p>
          <img src="assets/3_1_ExampleStimuli.png" alt="Example stimulus display 2" style="max-height: 30vh; border-radius: 6px;" />
        </div>
      </div>`,

      // ── Page 3: Trial sequence (text + four step images) ──
      `<div class="instructions-page text-left" style="display: flex; flex-direction: row; gap: 2rem; align-items: center; max-width: 1500px;">
        <div style="flex: 1;">
          <h2>Trial Sequence</h2>
          <p>Each trial follows the same sequence:</p>
          <ol>
            <li>A <strong>fixation cross</strong> appears at the centre of the screen. Please keep your eyes on it.</li>
            <li>The items appear <strong>briefly</strong> around the cross. Try to remember them.</li>
            <li>The screen goes blank for a short delay.</li>
            <li>A <strong>response wheel</strong> appears at the location of one of the items.</li>
          </ol>
          <p>
            Any item is equally likely to be tested, so try to remember
            <strong>all</strong> of them as well as you can.
          </p>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.3rem; align-items: center;">
          <p style="margin: 0; font-weight: bold;">1. Fixation</p>
          <img src="assets/FixationCross.png" alt="Fixation cross" style="max-height: 14vh; border-radius: 6px;" />
          <p style="margin: 0.3rem 0 0; font-weight: bold;">2. Stimulus display</p>
          <img src="assets/3_1_ExampleStimuli.png" alt="Stimulus display" style="max-height: 14vh; border-radius: 6px;" />
          <p style="margin: 0.3rem 0 0; font-weight: bold;">3. Retention</p>
          <img src="assets/FixationCross.png" alt="Retention interval" style="max-height: 14vh; border-radius: 6px;" />
          <p style="margin: 0.3rem 0 0; font-weight: bold;">4. Response</p>
          <img src="assets/ColorResponseWheelEmpty.png" alt="Response wheel" style="max-height: 14vh; border-radius: 6px;" />
        </div>
      </div>`,

      // ── Page 4: How to respond (text + two response wheel examples) ──
      `<div class="instructions-page text-left" style="display: flex; flex-direction: row; gap: 2rem; align-items: center; max-width: 85vw;">
        <div style="flex: 1;">
          <h2>How to Respond</h2>
          <p>
            Your task is to reproduce the remembered feature (colour or orientation)
            of the item that was at the wheel's location.
          </p>
          <ol>
            <li><strong>Click once</strong> on the wheel to select your initial response. A preview of your selection will appear.</li>
            <li><strong>Move the mouse</strong> to adjust your response. The preview updates in real time.</li>
            <li><strong>Click again</strong> to confirm and move on to the next trial.</li>
          </ol>
          <p>
            Try to be as accurate as possible. There is no time limit for responding.
          </p>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem; align-items: center;">
          <p style="margin: 0; font-weight: bold;">Orientation response</p>
          <img src="assets/OrientationResponseWheelPopulated.png" alt="Orientation response wheel example" style="max-height: 30vh; border-radius: 6px;" />
          <p style="margin: 0.5rem 0 0; font-weight: bold;">Colour response</p>
          <img src="assets/ColorResponseWheelPopulated.png" alt="Colour response wheel example" style="max-height: 30vh; border-radius: 6px;" />
        </div>
      </div>`,

      // ── Page 5: Important notes ──
      `<div class="instructions-page text-left">
        <h2>Important</h2>
        <ul>
          <li>Keep your eyes on the <strong>fixation cross</strong> while the items are on screen.</li>
          <li>The items appear only <strong>very briefly</strong> — stay focused.</li>
          <li>Please do <strong>not</strong> leave the browser tab during the experiment.</li>
          <li>The experiment consists of <strong>8 blocks</strong> with short breaks in between.</li>
        </ul>
      </div>`,

      // ── Page 6: Practice announcement ──
      `<div class="instructions-page">
        <h2>Practice</h2>
        <p>
          Before the experiment begins, you will complete
          <strong>10 practice trials</strong> to familiarise yourself with the task.
          After each practice trial, you will receive feedback on your accuracy.
        </p>
        <p>
          If you have any questions, use the "Previous" button to re-read
          the instructions. Otherwise, press "Next" to start the practice.
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

export function makePracticeTransition() {
  return {
    type: HtmlButtonResponsePlugin,
    stimulus: `
      <div class="instructions-page">
        <h2>Practice Complete</h2>
        <p>
          You have completed the practice trials.
          The main experiment will now begin.
        </p>
        <p>
          From now on, you will <strong>not</strong> receive feedback after each trial.
          There will be short breaks between blocks.
        </p>
        <p>Press the button below when you are ready to start.</p>
      </div>
    `,
    choices: ["Start Experiment"],
  };
}
