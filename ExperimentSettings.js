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
    // White background — matches Exp2B's #FFFFFF and the Markov et al. (2019) setup.
    backgroundLightness: 1,
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
  //
  // Retention is condition-dependent so that each trial's total
  // (sample + retention) encoding window is constant at 3200 ms:
  //   Combined-3: 600 + 2600 = 3200
  //   Combined-6: 1200 + 2000 = 3200
  //   Split:      600 + 1000 + 600 + 1000 = 3200  (sample1 + ISI + sample2 + retention)
  timing: {
    sampleDurationPerItemMs: 200,
    splitISIMs: 1000,            // blank between the two split-screen halves
    retentionMs: {
      combined3: 2600,
      combined6: 2000,
      split: 1000,
    },
    interProbeISIMs: 100,        // blank between the two recall probes (matches Exp2B)
  },

  // ── Stimulus Appearance ────────────────────────────────────────────────────
  stimuli: {
    // Black stimuli on white background (matches Exp2B).
    lightness: 0,
    chroma: 0,

    // Triangle aspect ratio (height/base). Only the ratio matters —
    // absolute size is derived per trial from the grid-cell radius so that
    // the triangle's area equals the area of the equivalent Exp2B circle
    // (π · r²). See getTriangleDimensions() in gridPositioning.js.
    triangleAspectRatio: 50 / 28,

    // Fraction of π·r² used as the triangle's target area. 1.0 exactly
    // matches the Exp2B circle's area, but because the isosceles triangle is
    // tall, that causes the apex to poke into the orientation wheel's
    // annulus during recall. Dropping to ~0.7 shrinks the apex to roughly
    // the wheel's inner edge while keeping the triangle visibly "pointy".
    triangleAreaFraction: 0.6,
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
