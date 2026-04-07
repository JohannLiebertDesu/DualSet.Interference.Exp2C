// base: "./" — By default, Vite assumes your app lives at the root of a domain (/). 
// But JATOS serves your study from a nested path like /publix/abc123/. 
// Setting base: "./" makes all asset references relative, so the built files can find each other no matter where they're deployed. 
// Think of it as printing "Theatre, 3rd door on the left" instead of "123 Main Street" — it works regardless of which building you're in.
//
// rollupOptions.input — Vite normally expects a single index.html entry point.
// Here we tell it about all three components (consent, experiment, debrief),
// so one `npm run build` produces a dist/ folder with all three built and ready to upload to JATOS.
// Each component is a completely independent page — its own HTML, its own jsPsych instance.

import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      input: {
        consent: resolve(__dirname, "consent.html"),
        experiment: resolve(__dirname, "experiment.html"),
        debrief: resolve(__dirname, "debrief.html"),
      },
    },
  },
});