/**
 * Prolific completion codes for failure/screening outcomes.
 *
 * Imported by the experiment component for participants who get kicked out
 * (failed attention check, screen too small). Exposure is not a concern
 * since these participants aren't completing the study anyway.
 *
 * The success completion code lives separately in debrief/src/prolificCodes.js
 * and is only loaded when the participant reaches the debrief.
 *
 * In Prolific, set up custom completion codes under Study Settings →
 * Completion Codes to automatically handle submissions based on which
 * code the participant is redirected with.
 *
 * EDIT: Replace the codes below with your actual Prolific codes.
 */

const PROLIFIC_BASE = "https://app.prolific.com/submissions/complete?cc=";

export const ProlificFailCodes = {
  // Participant was screened out (e.g., screen too small).
  screenedOut: PROLIFIC_BASE + "C1LKH23V",

  // Participant failed attention checks (too many tab switches).
  attentionFailed: PROLIFIC_BASE + "C16PVDBW",
};
