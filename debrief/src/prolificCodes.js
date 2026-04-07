/**
 * Prolific completion code for successful study completion.
 *
 * This file is ONLY imported by the debrief component, so the success code
 * is not accessible from the browser console during consent or experiment.
 * Participants cannot see it until they actually reach the debrief.
 *
 * Failure codes (attention check, screen size) are in experiment/src/prolificFailCodes.js
 * since they're needed in the experiment component — but those are only relevant
 * for participants being kicked out, so exposure is not a concern.
 *
 * EDIT: Replace the code below with your actual Prolific completion code.
 */

const PROLIFIC_BASE = "https://app.prolific.com/submissions/complete?cc=";

export const PROLIFIC_COMPLETED_URL = PROLIFIC_BASE + "XXXXXXXX";
