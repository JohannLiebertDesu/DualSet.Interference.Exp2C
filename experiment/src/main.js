// This is your control flow — it decides what happens in what order. 
// The import statements at the top are like calling in actors (plugins) from their dressing rooms (node_modules). 
// The makeTimeline() function is your scene list. 
// The start() function handles the "which theatre are we in?" logic (JATOS vs local).

import { initJsPsych, ParameterType } from "jspsych";
import "jspsych/css/jspsych.css";

import PreloadPlugin from "@jspsych/plugin-preload";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import jsPsychPsychophysics from "@kurokida/jspsych-psychophysics";

// The plugin defaults canvas_offsetY to 8 to avoid scrollbars, but our
// .canvas-trial CSS class handles that with overflow: hidden instead.
jsPsychPsychophysics.info.parameters.canvas_offsetY.default = 0;

// The plugin defines startX/startY/endX/endY as STRING type (because they
// accept "center"), but we pass numbers. Override to COMPLEX to silence
// the thousands of "non-string value" warnings that flood the console.
const posParams = ["startX", "startY", "endX", "endY"];
for (const p of posParams) {
  jsPsychPsychophysics.info.parameters.stimuli.nested[p].type = ParameterType.COMPLEX;
}

import { assembleExperiment } from "../../functions/experiment/experimentAssembly.js";

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

function makeTimeline(jsPsych, blurMonitor, conditionLabel) {
  const timeline = [];

  timeline.push({
    type: PreloadPlugin,
    max_load_time: 30000,
    show_progress_bar: true,
    images: [
      "assets/Combined6.png",
      "assets/Blank.png",
      "assets/ResponseWheelEmpty1.png",
      "assets/ResponseWheelFilled1.png",
      "assets/ResponseWheelEmpty2.png",
      "assets/ResponseWheelFilled2.png",
    ],
  });

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

  // ── Experiment trials ──
  // Practice, main mini-blocks, and between-block breaks are all assembled in
  // order here, in the block order set by the participant's between-subject
  // condition (CS = Combined first, SC = Split first).
  timeline.push(...assembleExperiment(jsPsych, conditionLabel));

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

  // Global error handler — catches unhandled errors and displays them on screen
  // so crashes don't result in a silent blank page. Remove for production if desired.
  window.onerror = (msg, src, line, col, err) => {
    document.body.innerHTML = `
      <div style="padding:2rem; font-family:monospace; color:#c00; background:#fff;">
        <h2>Experiment Error</h2>
        <p>${msg}</p>
        <p>at ${src}:${line}:${col}</p>
        <pre>${err?.stack || ""}</pre>
      </div>`;
  };
  window.onunhandledrejection = (e) => {
    document.body.innerHTML = `
      <div style="padding:2rem; font-family:monospace; color:#c00; background:#fff;">
        <h2>Experiment Error (Promise)</h2>
        <pre>${e.reason?.stack || e.reason}</pre>
      </div>`;
  };


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

    // ── Canvas context cleanup ─────────────────────────────────────────────
    // The psychophysics plugin creates a canvas per trial phase and sets
    // references on the trial object (trial.context, trial.canvas, etc.) and
    // on stimulus objects (stim.instance). After the trial the canvas is removed
    // from the DOM, but these JS references prevent it from being garbage-collected.
    // Over ~1,200 trial phases this exhausts the browser's canvas memory.
    // See docs/canvas-context-leak.md for the full explanation.
    //
    // on_trial_start receives the resolved trial object — the same object the
    // plugin's trial() method will modify. We capture it here so on_trial_finish
    // can delete the references the plugin sets on it.
    on_trial_start: (trial) => {
      if (trial.type === jsPsychPsychophysics) {
        jsPsych._lastPsychTrial = trial;
      } else {
        jsPsych._lastPsychTrial = null;
      }
    },
    on_trial_finish: () => {
      const trial = jsPsych._lastPsychTrial;
      if (!trial) return;
      jsPsych._lastPsychTrial = null;

      // 1. stim.instance → class prototype → trial() closure → ctx → canvas
      if (Array.isArray(trial.stimuli)) {
        for (const stim of trial.stimuli) delete stim.instance;
      }
      // 2. Direct references the plugin sets on the trial object:
      //    context/canvas → the main canvas and its 2D context
      //    end_trial → closure capturing ctx, canvas, and all class definitions
      //    getColorNum → closure capturing canvas_for_color (hidden utility canvas)
      delete trial.context;
      delete trial.canvas;
      delete trial.end_trial;
      delete trial.getColorNum;
      delete trial.centerX;
      delete trial.centerY;
    },

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

  // The condition must be known before building the timeline (it drives block
  // order and Split probing rule), so assign it before assembling trials.
  if (inJatos) {
    window.jatos.onLoad(async () => {
      const proceed = await checkEnrollmentCap(Settings.recruitment);
      if (!proceed) return; // closed message already shown by checkEnrollmentCap
      stampParticipantData(jsPsych, true);
      const condition = await assignCondition(Settings.recruitment);
      if (condition !== null) jsPsych.data.addProperties({ condition });
      const timeline = makeTimeline(jsPsych, blurMonitor, condition);
      jsPsych.run(timeline);
    });
  } else {
    stampParticipantData(jsPsych, false);
    const condition = await assignCondition(Settings.recruitment);
    if (condition !== null) jsPsych.data.addProperties({ condition });
    const timeline = makeTimeline(jsPsych, blurMonitor, condition);
    jsPsych.run(timeline);
  }
}

// Call the function. Else, we define a plan but never execute it.
start();