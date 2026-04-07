/**
 * Checks whether enrollment is still open, and if so, reserves a slot.
 *
 * Should be called at the very start of consent (inside jatos.onLoad), before
 * running the timeline. Only active in JATOS with a non-Prolific, capped study.
 *
 * Uses a "started" counter in the batch session — not "completions" — so the
 * check happens as early as possible (consent load) rather than at study end.
 * With batchSessionVersioning on (default), concurrent writes conflict: only one
 * succeeds per slot, so two people racing for the last spot can't both get through.
 *
 * @param {object} settings - The exported Settings object from ExperimentSettings.js
 * @returns {Promise<boolean>} true = proceed, false = cap reached (closed message shown)
 */
export async function checkEnrollmentCap(settings) {
  // Skip the check if Prolific handles counts, or no cap is set.
  if (settings.useProlific || settings.maxParticipants === null) return true;

  // Try up to 3 times in case of concurrent write conflicts.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const n = window.jatos.batchSession.get("started") ?? 0;

      if (n >= settings.maxParticipants) {
        // Cap reached — show a polite message and halt. No slot is reserved.
        document.body.innerHTML =
          "<p>We're sorry — we are no longer looking for participants for this study. Thank you for your interest.</p>";
        return false;
      }

      // Slot is available — claim it. If another participant writes at the exact
      // same moment, batchSessionVersioning rejects this write and we retry.
      await window.jatos.batchSession.add("/started", n + 1);
      return true; // slot reserved successfully
    } catch (_) {
      // Version conflict — re-read the fresh value and try again.
    }
  }

  // After 3 failed writes we can't confirm the count. Allow through — it's
  // better to admit one extra participant than to wrongly block a valid one.
  return true;
}
