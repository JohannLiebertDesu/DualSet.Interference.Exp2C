# To Do

- [x] Equalize surface area of triangle and color patch stimuli (currently triangle ~224 sq px vs circle ~314 sq px)
- [x] Unify OKLCH lightness and chroma values across the experiment (currently defined separately in stimuli.js defaults, ExperimentSettings.js background, screenCheck.js, etc.)
- [x] Spatial arrangement for mixed trials: 3+3 interleaved (alternating color/orientation), 3+1 intruder randomly assigned to one of the slots
- [x] Break screens between mini-blocks
- [x] Hide mouse cursor during fixation/sample/retention, show only during recall
- [x] Change synthetic key for recall trial termination from "a" to something less likely to be pressed accidentally (now F24)
- [x] Check what happens when participant double-clicks without moving the mouse (stores the angle from the click position — valid response)
- [x] Store firstClickRt in recall data
- [x] Instructions (replace template placeholder)
- [x] Transition screen between practice and main experiment
- [x] Practice feedback
- [ ] Final check on error calculation (selectedAngle vs probeFeatureValue, wheelOffset handling per dimension)
- [ ] Check whether Prolific participant ID is being stored (stampParticipantData in main.js)
- [x] Check load-time behaviour at experiment start (added preload with 30s timeout for all assets)
- [x] Consent/debrief content (study-specific wording)
- [x] ExperimentSettings.js study info (description, task, duration)
