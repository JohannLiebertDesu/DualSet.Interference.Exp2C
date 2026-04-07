// This is your control flow — it decides what happens in what order.
// The import statements at the top are like calling in actors (plugins) from their dressing rooms (node_modules).
// The makeTimeline() function is your scene list.
// The start() function handles the "which theatre are we in?" logic (JATOS vs local).

import { initJsPsych } from "jspsych";
import "jspsych/css/jspsych.css";

import SurveyPlugin from "@jspsych/plugin-survey";
import "@jspsych/plugin-survey/css/survey.css";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";

import { Settings } from "../../ExperimentSettings.js";
import { loadJatosScript } from "../../functions/global/jatos.js";
import { stampParticipantData } from "../../functions/global/participantID";
import { questionnaireSurveyJSON } from "./questionnairePage.js";
import { debriefPageHTML } from "./debriefPage.js";
import { makeRedirectTrial } from "./redirectPage.js";
import { PROLIFIC_COMPLETED_URL } from "./prolificCodes.js";

// Since we load the following import after the jspsych/css/jspsych.css import, it always wins
// -> that way for modifications of the css we never need to hack jsPsych's own CSS
import "../../styles/common.css";

function makeTimeline() {
  const timeline = [];

  // Page 1: Post-experiment questionnaire
  // Questions are defined in questionnairePage.js — edit that file to customise.
  timeline.push({
    type: SurveyPlugin,
    survey_json: questionnaireSurveyJSON(),
  });

  // Page 2: Debrief text — explains the study and provides contact info.
  // Content is defined in debriefPage.js; contact info pulled from Settings.
  timeline.push({
    type: HtmlButtonResponsePlugin,
    stimulus: debriefPageHTML(Settings),
    choices: ["Finish"],
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

  const useProlific = Settings.recruitment.useProlific;

  // Engine is built with its rules (abort button, on_finish). Nothing runs yet.
  const jsPsych = initJsPsych({
    // jsPsych is told here what it should do with the data once the last trial in the timeline completes.
    on_finish: async () => {
      if (inJatos) {
        if (useProlific) {
          // Prolific path: data was already submitted and completions counter
          // was already incremented during the redirect countdown page's on_load.
          // Redirect to Prolific with the success completion code.
          window.jatos.endStudyAndRedirect(PROLIFIC_COMPLETED_URL, true, "study_complete (prolific)");
        } else {
          // Non-Prolific JATOS path: submit data and increment completions here.
          const resultJson = jsPsych.data.get().json();

          // Increment the batch-level completion counter so we always know how many
          // participants made it all the way through. add() means "create/overwrite",
          // so the counter self-initializes to 1 on the very first completion — no
          // pre-seeding needed. Wrapped in try/catch because batchSessionVersioning
          // (on by default) rejects concurrent writes; a missed count is preferable
          // to leaving the participant stuck before endStudy.
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              const n = window.jatos.batchSession.get("completions") ?? 0;
              await window.jatos.batchSession.add("/completions", n + 1);
              break; // success — stop retrying
            } catch (_) {
              // Concurrent write conflict; retry once, then give up silently.
            }
          }

          // Send the json string to JATOS and tell it to end the experiment.
          window.jatos.endStudy(resultJson, true, "study_complete");
        }
      } else {
        // This is jsPsych's useful shortcut if we want to download data in json format.
        jsPsych.data.get().localSave("json", "data.json");

        document.body.innerHTML = "<p>Study complete. You may close this tab.</p>";
      }
    },
  });

  // Trial list is assembled. Nothing runs yet.
  const timeline = makeTimeline();

  // For Prolific: append a redirect countdown page that immediately saves data
  // and increments the completions counter, then counts down before endStudy()
  // triggers the redirect to Prolific via the study's endRedirectUrl in JATOS.
  if (useProlific) {
    timeline.push(makeRedirectTrial(jsPsych));
  }

  if (inJatos) {
    window.jatos.onLoad(() => {
      stampParticipantData(jsPsych, true);
      jsPsych.run(timeline);
    });
  } else {
    stampParticipantData(jsPsych, false);
    jsPsych.run(timeline);
  }
}

// Call the function. Else, we define a plan but never execute it.
start();
