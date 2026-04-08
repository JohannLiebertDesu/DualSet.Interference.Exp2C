// This is your control flow — it decides what happens in what order. 
// The import statements at the top are like calling in actors (plugins) from their dressing rooms (node_modules). 
// The makeTimeline() function is your scene list. 
// The start() function handles the "which theatre are we in?" logic (JATOS vs local).

import { initJsPsych } from "jspsych";
import "jspsych/css/jspsych.css";

import PreloadPlugin from "@jspsych/plugin-preload";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import jsPsychPsychophysics from "@kurokida/jspsych-psychophysics";

// The plugin defaults canvas_offsetY to 8 to avoid scrollbars, but our
// .canvas-trial CSS class handles that with overflow: hidden instead.
jsPsychPsychophysics.info.parameters.canvas_offsetY.default = 0;

import { getRingPositions } from "../../functions/experiment/ringPositions.js";
import { makeTriangleStimulus, makeColorPatchStimulus } from "../../functions/experiment/stimuli.js";

// Since we load the following import after the jspsych/css/jspsych.css import, it always wins 
// -> that way for modifications of the css we never need to kack jsPsych's own CSS
import "./style.css";
import { stampParticipantData } from "../../functions/global/participantID";
import { Settings } from "../../ExperimentSettings.js";
import { loadJatosScript } from "../../functions/global/jatos.js";
import { checkEnrollmentCap } from "../../functions/global/enrollmentCap.js";
import { assignCondition } from "../../functions/global/conditionAssignment.js";
import { makeScreenCheck } from "../../functions/global/screenCheck.js";
import { createBlurMonitor } from "../../functions/global/blurMonitor.js";
import { makeInstructions } from "./instructions.js";
import { ProlificFailCodes } from "./prolificFailCodes.js";

function makeTimeline(jsPsych, blurMonitor) {
  const timeline = [];

  // timeline.push({
  //   type: PreloadPlugin,
  //   // files put into public/assets/... can be referenced here, like so:
  //   images: ["assets/instructions/Slide1.gif"],
  // });

  // NOTE: When the browser later exits fullscreen (e.g. page navigation to debrief),
  // it briefly flashes a cached snapshot of the page from when fullscreen was entered
  // (the message + button from this trial). This is a browser compositor-level behaviour
  // that cannot be prevented from JavaScript — it's cosmetic and lasts ~1 frame.
  timeline.push({
    type: FullscreenPlugin,
    fullscreen_mode: true,
    message: `
      <p><strong>Experiment</strong></p>
      <p>The experiment is about to begin. Your screen will be checked for
      compatibility, after which you will receive detailed instructions.</p>
      <p>Click the button below to enter fullscreen mode and continue.</p>
    `,
  });

  // Right after fullscreen: verify the screen is large enough, then arm blur tracking.
  timeline.push(makeScreenCheck(jsPsych, Settings.browserChecks, blurMonitor));

  // ── Instructions (back/next navigation) ──
  // Edit the pages in experiment/src/instructions.js.
  timeline.push(makeInstructions());

  // ── Visual test: render stimuli on the invisible ring ──
  // This is a temporary demo trial — will be replaced by real trial logic.
  timeline.push({
    type: jsPsychPsychophysics,
    background_color: Settings.display.trialBackgroundColor,
    css_classes: "canvas-trial",
    response_type: "key",
    choices: "ALL_KEYS",
    stimuli: () => {
      const { positions } = getRingPositions(6, 120);
      const stims = [];

      for (let i = 0; i < 3; i++) {
        const orientation = Math.random() * 360;
        stims.push(makeOrientedTriangleStimulus(positions[i].x, positions[i].y, orientation));
      }

      for (let i = 3; i < 6; i++) {
        const hue = Math.random() * 360;
        stims.push(makeColorPatchStimulus(positions[i].x, positions[i].y, hue));
      }

      stims.push({
        obj_type: "cross",
        origin_center: true,
        startX: 0,
        startY: 0,
        line_length: 12,
        line_color: "white",
      });

      return stims;
    },
  });

  timeline.push({
    type: HtmlKeyboardResponsePlugin,
    stimulus: "<p><strong>Experiment Complete</strong></p><p>You have finished the experiment. Press any key to continue to the debrief.</p>",
  });

  return timeline;
}

/**
 * The entire start() function exists because of a single constraint: you don't know where your code will run until runtime (JATOS or local)
 */
async function start() {

  // The async keyword lets us use await inside the function, which lets us pause until we finish a process.
  // Loading the JATOS script takes time (the browser needs to fetch it from the network)
  await loadJatosScript();

  // If loadJatosScript() succeeeded, JATOS's script will have attached a window.jatos object.
  // This line checks: "Did that object appear?"
  // typeof is used because it wont throw an error on things that might not exist at all.
  const inJatos = typeof window.jatos !== "undefined";

  // Create the blur monitor before initJsPsych so we can pass its handler as a config option.
  // It stays dormant until activate() is called by the screen check on success,
  // so blurs during setup screens (fullscreen prompt, etc.) don't count.
  const blurMonitor = createBlurMonitor(Settings.browserChecks);

  const jsPsych = initJsPsych({
    // Fires every time the participant switches away from or back to the tab.
    // The blur monitor uses this to count tab-leaves and warn/end accordingly.
    on_interaction_data_update: (data) => blurMonitor.handler(data),
    // jsPsych is told here what it should do with the data once the last trial in the timeline completes.
    on_finish: async () => {
      // Check whether the experiment ended early due to a screen or attention failure.
      // addProperties() stamps every trial row, so any row carries the flag.
      const trials = jsPsych.data.get().values();
      const status = trials.length > 0 ? trials[0].experiment_status : undefined;
      const failed =
        status === "failed_resize" ||
        status === "failed_color_support" ||
        status === "failed_attention_check";

      if (inJatos) {
        // Open the file cabinet (data), grab the files (get()), and photocopy them to a document any browser can handle (.json()).
        const resultJson = jsPsych.data.get().json();

        if (failed) {
          // Screen-size and color-support failures free the enrollment slot —
          // the participant never could have run, so we release the "started" count.
          if (status === "failed_resize" || status === "failed_color_support") {
            for (let attempt = 0; attempt < 2; attempt++) {
              try {
                const n = window.jatos.batchSession.get("started") ?? 0;
                if (n > 0)
                  await window.jatos.batchSession.add("/started", n - 1);
                break;
              } catch (_) {
                // Version conflict — retry once.
              }
            }
          }
          // End study directly — skip debrief. Data still reaches JATOS
          // with the experiment_status flag for filtering during analysis.
          // The message (max 255 chars) appears in JATOS's "message" results column.
          if (Settings.recruitment.useProlific) {
            // Redirect to Prolific with the appropriate failure code.
            const redirectUrl =
              status === "failed_resize" || status === "failed_color_support"
                ? ProlificFailCodes.screenedOut
                : ProlificFailCodes.attentionFailed;
            window.jatos.endStudyAndRedirect(redirectUrl, false, status);
          } else {
            window.jatos.endStudy(resultJson, false, status);
          }
        } else {
          // Normal completion — proceed to debrief.
          // The message appears in JATOS's "message" results column for this component.
          window.jatos.startNextComponent(resultJson, "experiment_complete");
        }
      } else {
        // This is jsPsych's useful shortcut if we want to download data in json format.
        jsPsych.data.get().localSave("json", "data.json");

        // Locally, JATOS isn't available to navigate for us, so we redirect manually.
        // But only if the experiment completed normally — on failure, stay on the end message.
        if (!failed) {
          window.location.href = "/debrief.html";
        }
      }
    },
  });

  // Now that jsPsych exists, hand it to the blur monitor so it can call
  // pauseExperiment(), resumeExperiment(), and abortExperiment() when needed.
  blurMonitor.init(jsPsych);

  // Trial list is assembled. Nothing runs yet.
  const timeline = makeTimeline(jsPsych, blurMonitor);

  if (inJatos) {
    window.jatos.onLoad(async () => {
      const proceed = await checkEnrollmentCap(Settings.recruitment);
      if (!proceed) return; // closed message already shown by checkEnrollmentCap
      stampParticipantData(jsPsych, true);
      const condition = await assignCondition(Settings.recruitment);
      if (condition !== null) jsPsych.data.addProperties({ condition });
      jsPsych.run(timeline);
    });
  } else {
    stampParticipantData(jsPsych, false);
    const condition = await assignCondition(Settings.recruitment);
    if (condition !== null) jsPsych.data.addProperties({ condition });
    jsPsych.run(timeline);
  }
}

// Call the function. Else, we define a plan but never execute it.
start();