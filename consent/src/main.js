// This is your control flow — it decides what happens in what order.
// The import statements at the top are like calling in actors (plugins) from their dressing rooms (node_modules).
// The makeTimeline() function is your scene list.
// The start() function handles the "which theatre are we in?" logic (JATOS vs local).

import { initJsPsych } from "jspsych";
import "jspsych/css/jspsych.css";

import PreloadPlugin from "@jspsych/plugin-preload";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";

import { Settings } from "../../ExperimentSettings.js";
import { loadJatosScript } from "../../functions/global/jatos.js";
import { consentPageHTML } from "./consentPage.js";
import { guidelinesPageHTML } from "./guidelinesPage.js";

// Since we load the following import after the jspsych/css/jspsych.css import, it always wins
// -> that way for modifications of the css we never need to hack jsPsych's own CSS
import "../../styles/common.css";

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox-gated button logic
//
// Used on both consent pages: the proceed button starts disabled and is only
// enabled once every checkbox on the current page is checked.
// ─────────────────────────────────────────────────────────────────────────────

function enableButtonWhenAllChecked() {
  // The html-button-response plugin renders buttons inside #jspsych-html-button-response-btngroup.
  // Individual buttons don't have IDs — they use data-choice attributes.
  const btn = document.querySelector('#jspsych-html-button-response-btngroup button[data-choice="0"]');
  btn.disabled = true;

  const checkboxes = document.querySelectorAll(".consent-check");
  checkboxes.forEach((cb) => {
    cb.addEventListener("change", () => {
      btn.disabled = ![...checkboxes].every((c) => c.checked);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Timeline
// ─────────────────────────────────────────────────────────────────────────────

function makeTimeline() {
  const timeline = [];

  // timeline.push({
  //   type: PreloadPlugin,
  //   // files put into public/assets/... can be referenced here, like so:
  //   images: ["assets/instructions/Slide1.gif"],
  // });

  // Page 1: Study information & informed consent
  // All study-specific content (description, eligibility, duration, etc.)
  // is pulled from the Settings object — edit ExperimentSettings.js, not here.
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: consentPageHTML(Settings),
    choices: ["Agree and Continue"],
    // The button starts disabled; enableButtonWhenAllChecked() enables it
    // once every checkbox is ticked.
    on_load: enableButtonWhenAllChecked,
  });

  // Page 2: Experiment guidelines
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: guidelinesPageHTML(Settings),
    choices: ["I'm Ready — Start the Experiment"],
    on_load: enableButtonWhenAllChecked,
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

  const jsPsych = initJsPsych({
    // jsPsych is told here what it should do with the data once the last trial in the timeline completes.
    on_finish: () => {
      if (inJatos) {
        // If we're in JATOS, tell it to move to the next component (experiment).
        // No data to send from consent — the important thing is that they agreed.
        window.jatos.startNextComponent(undefined, "consent_given");
      } else {
        // Locally, JATOS isn't available to navigate for us, so we redirect manually.
        window.location.href = "/experiment.html";
      }
    },
  });

  const timeline = makeTimeline();

  if (inJatos) {
    window.jatos.onLoad(() => jsPsych.run(timeline));
  } else {
    jsPsych.run(timeline);
  }
}

// Call the function. Else, we define a plan but never execute it.
start();
