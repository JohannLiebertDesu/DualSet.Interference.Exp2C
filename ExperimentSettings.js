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

    // List of condition labels to cycle through, assigned round-robin across participants.
    // e.g. ['A', 'B'] or ['control', 'treatment'] or ['0deg', '45deg', '90deg'].
    // null = no condition assignment.
    conditions: null,
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
    maxBlurs: null,
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
  timing: {
    fixationDurationMs: 1000,
    sampleDurationPerItemMs: 150,
    retentionDurationMs: 1000,
  },

  // ── Stimulus Appearance ────────────────────────────────────────────────────
  stimuli: {
    // Global OKLCH lightness and chroma for all stimulus items.
    // These are used by the stimulus factories in stimuli.js as defaults.
    lightness: 0.8,
    chroma: 0.1,
  },

  responseWheel: {
    innerRadius: 40,
    outerRadius: 63,
  },

  // ── Study Information (used by consent pages) ──────────────────────────────
  study: {
    // What the study examines — shown under "What this study is about".
    description:
      "This study examines how people remember different visual features, such as colours and orientations, when they appear together in a brief display.",

    // What participants will do — shown directly after the description.
    task:
      "Your task will be to memorise a set of briefly presented items and then report one of them using a response wheel.",

    // Approximate duration — shown under "Duration & compensation".
    duration: "30–40 minutes",

    // Compensation text (non-Prolific). Prolific overrides this automatically.
    compensation: "1 participant subject hour",

    // Risks statement — shown under "Risks". Adjust if your study carries specific risks.
    risks: "No risks or harms are known to be caused by this experiment.",
  },

  // ── Eligibility Criteria ───────────────────────────────────────────────────
  // Active criteria are combined into a readable sentence on the consent page.
  // Set a criterion to false (or ageRange to null) to omit it.
  eligibility: {
    englishSpeaker: true,
    ageRange: "18–35",        // null = omit age requirement
    normalVision: true,       // "normal or corrected-to-normal vision"
    notColourBlind: false,    // "not colour-blind"
  },

  // ── Contact Information ────────────────────────────────────────────────────
  contact: {
    name: "Noah Rischert",
    email: "rischert@psychologie.uzh.ch",
    institution: "University of Zurich, Switzerland",
  },
};
