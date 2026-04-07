/**
 * Assigns a condition to the current participant using round-robin ordering.
 *
 * Uses a "nextConditionIndex" counter in the batch session — the same atomic
 * increment pattern as enrollmentCap.js. Each participant claims the next index
 * and maps it to a condition via modulo, so conditions cycle evenly regardless
 * of how many participants run (e.g. with ['A','B']: P1→A, P2→B, P3→A, ...).
 *
 * Falls back to a random pick if all retry attempts fail (concurrent conflicts
 * on a very busy server). In dev mode (no batchSession), returns the first
 * condition so the timeline always has a valid value to work with.
 *
 * @param {object} settings - The exported Settings object from ExperimentSettings.js
 * @returns {Promise<string|null>} The assigned condition label, or null if conditions is null.
 */
export async function assignCondition(settings) {
  if (!settings.conditions || settings.conditions.length === 0) return null;

  // Dev mode — no batchSession available; return first condition for predictable testing.
  if (typeof window.jatos === "undefined") {
    return settings.conditions[0];
  }

  // Try up to 3 times in case of concurrent write conflicts.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const index = window.jatos.batchSession.get("nextConditionIndex") ?? 0;
      await window.jatos.batchSession.add("/nextConditionIndex", index + 1);
      return settings.conditions[index % settings.conditions.length];
    } catch (_) {
      // Version conflict — re-read the fresh index and try again.
    }
  }

  // All retries failed — fall back to random assignment so the experiment still runs.
  return settings.conditions[Math.floor(Math.random() * settings.conditions.length)];
}
