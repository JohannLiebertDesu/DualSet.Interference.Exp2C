/**
 * Loads JATOS' runtime-injected `jatos.js` (available only when running inside JATOS).
 *
 * JATOS injects `jatos.js` at runtime on its own server — it's never in your source code.
 * This loader attempts to fetch it: it succeeds in JATOS and fails gracefully (404) locally.
 * The boolean result lets you set an `inJatos` flag and branch behavior.
 *
 * @returns {Promise<boolean>} Resolves `true` if `jatos.js` loaded, otherwise `false`.
 */
export function loadJatosScript() {
  return new Promise((resolve) => {
    // Creates a new script element in memory. At this point it's just floating, not attached to the page, not doing anything.
    // Document is only the factory, the script itself is not attached to document yet!
    const s = document.createElement("script");
    // Sets the script's source URL. Still hasn't fetched anything yet.
    s.src = "jatos.js"; // exists in JATOS, 404 locally
    // Tells the browser "when you do fetch this, don't block anything else while you're doing it." Like saying "go pick this up in the background."
    s.async = true;
    // Sets up two possible outcomes: if the jatos.js script can successfully be found, resolve the Promise with true.
    // If it fails (404 locally), resolve with false. Crucially, both paths resolve — neither rejects.
    // The promise always completes successfully; it just carries a different answer.
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    // This is the trigger. The moment you append the script element to the page's <head>, the browser actually goes out and tries to fetch jatos.js from the network.
    // Everything before this was just preparation.
    document.head.appendChild(s);
    // If the load succeeds (we're in JATOS), the fetched script executes. That execution is what creates the window.jatos object with all its methods (onLoad, addAbortButton, startNextComponent, etc.).
    // The window.jatos object lets us talk with the already running JATOS server.
    // document.head is the <head> section of the HTML -> the part that holds metadata, CSS links and scripts that configure the page (not stuff we "see")
  });
}
