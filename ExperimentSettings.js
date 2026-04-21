export const Settings = {

  // ── Recruitment & Distribution ─────────────────────────────────────────────
  recruitment: {
    // Set to true when distributing through Prolific.
    // Prolific manages its own participant counts, so the cap check is skipped.
    // Also adjusts consent text (compensation, prescreening, redirect info).
    useProlific: true,

    // Set to a number to cap enrollment at that many participants.
    // The cap is checked at consent using the batch session's "started" counter.
    // null = no cap (check is skipped entirely).
    maxParticipants: null,

    // Between-subject counterbalancing (block order only).
    //   CS → Combined block first, Split block second
    //   SC → Split first, Combined second
    // Split blocks always use ABBA probing (right first, then left) — the
    // random-order variant from Exp2B has been dropped.
    // Assigned round-robin by conditionAssignment.js.
    conditions: ["CS", "SC"],
  },

  // ── Browser Checks ─────────────────────────────────────────────────────────
  browserChecks: {
    // Minimum browser window dimensions (checked after entering fullscreen).
    // If the screen is smaller, the experiment ends with "failed_resize".
    minScreenWidth: 1200,
    minScreenHeight: 700,

    // Maximum number of times a participant can leave the browser tab (blur events)
    // before the experiment ends with "failed_attention_check".
    // null = no blur tracking.
    maxBlurs: 2,
  },

  // ── Display ─────────────────────────────────────────────────────────────────
  display: {
    // Background colour for experiment/practice trials, specified as OKLCH components.
    // Standard mid-grey is the convention in vision science — neutral adaptation state
    // for luminance contrast. Lightness 0.6, zero chroma = perceptually uniform grey.
    backgroundLightness: 0.6,
    backgroundChroma: 0,
    backgroundHue: 0,
    get trialBackgroundColor() {
      return `oklch(${this.backgroundLightness} ${this.backgroundChroma} ${this.backgroundHue})`;
    },
  },

  // ── Trial Timing ───────────────────────────────────────────────────────────
  // No fixation cross — Exp2B had none, and Exp2C follows that convention.
  // Trials start directly with the sample display.
  //
  // 200 ms per item (doubled from Exp2B's 100 ms/item). Combined-3 = 600,
  // Combined-6 = 1200, Split screen (3 items) = 600.
  timing: {
    sampleDurationPerItemMs: 200,
    splitISIMs: 1000,            // blank between the two split-screen halves
    retentionDurationMs: 1000,   // blank between final sample display and probe 1
    interProbeISIMs: 100,        // blank between the two recall probes (matches Exp2B)
  },

  // ── Stimulus Appearance ────────────────────────────────────────────────────
  stimuli: {
    // Global OKLCH lightness and chroma for all stimulus items (orientation triangles
    // are achromatic, so chroma is unused for triangles; kept for any future use).
    lightness: 0.2,
    chroma: 0,

    // Triangle geometry (used by makeOrientedTriangleStimulus in stimuli.js).
    // Size is derived per trial from the grid cell, but these act as defaults.
    triangleBase: 28,
    triangleHeight: 50,
  },

  // ── Grid layout (ported from Exp2B createGrid.ts) ─────────────────────────
  // Stimuli are placed on an invisible grid spanning the canvas. Border and
  // middle-column cells are reserved; selected cells and their neighbours get
  // marked occupied to prevent overlap. Items are drawn in screen coordinates
  // (origin_center: false), matching Exp2B's positioning.
  grid: {
    numColumns: 13,
    numRows: 6,
    adjacencyLimit: 1,     // horizontal / vertical proximity
    diagonalAdjacency: 1,  // diagonal proximity
    // Triangle "radius" (centre → vertex) is derived as
    //   min(cellWidth, cellHeight) / cellRadiusDivisor
    // to match Exp2B's circle-size heuristic.
    cellRadiusDivisor: 2.3,
  },

  responseWheel: {
    // Proportional to the probed item's radius, so wheel scale tracks the
    // grid-cell size chosen for the screen.
    outerRadiusFactor: 2.7,
    innerRadiusFactor: 1.836,
    numGraduations: 12,
  },

  // ── Study Information (used by consent pages) ──────────────────────────────
  study: {
    description:
      "This study examines how people remember the orientations of briefly presented visual items.",

    task:
      "Your task will be to memorise a set of briefly presented oriented triangles and then reproduce two of them using a response wheel.",

    duration: "30–40 minutes",

    compensation: "1 participant subject hour",

    risks: "No risks or harms are known to be caused by this experiment.",
  },

  // ── Eligibility Criteria ───────────────────────────────────────────────────
  eligibility: {
    englishSpeaker: true,
    ageRange: "18–35",
    normalVision: true,
    notColourBlind: false,
  },

  // ── Contact Information ────────────────────────────────────────────────────
  contact: {
    name: "Noah Rischert",
    email: "rischert@psychologie.uzh.ch",
    institution: "University of Zurich, Switzerland",
  },
};
