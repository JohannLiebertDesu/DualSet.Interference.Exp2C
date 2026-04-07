# Side-by-Side Comparison: Wang et al. (2017), Markov et al. (2019), and Your Replication

## Research Aims and Conclusions

| | **Wang et al. (2017)** | **Markov et al. (2019)** | **Your Replication** |
|---|---|---|---|
| **Core question** | Do different feature dimensions (color, orientation) compete for a single shared VWM resource, or does each dimension have its own capacity? | Is the apparent independence between feature dimensions a genuine property of feature storage, or is it actually mediated by shared object representations underneath? | Can the *partial* cross-dimensional interference observed by Markov et al. in Experiment 2 (features on spatially separated objects) be replicated in an online setting? |
| **Key logic** | Hold one dimension's feature count fixed, vary the other, and see whether the fixed dimension suffers. | Replicate Wang et al.'s logic but manipulate whether features live on the same object, on overlapping parts, or on spatially separated objects. | Use spatially separated single-feature objects (oriented triangles vs. colored patches). Compare three critical contrasts: 4-of-same vs. 3+1 (does adding one item of the *other* dimension hurt as much as adding one item of the *same* dimension?), and 3+1 vs. 3+3 (does scaling the cross-dimension load amplify the cost?). |
| **Main finding** | Memory for the fixed dimension was largely unaffected by load on the variable dimension. | Independence replicated when features shared an object/location; partial cross-dimensional interference emerged when features were on spatially separated objects. | *(TBD — pending data collection)* |
| **Conclusion** | Different feature dimensions recruit separate VWM modules. | Feature independence is mediated by shared object representations; supports a hierarchical VWM model. | *(TBD)* |

## Methodological Comparison

| **Parameter** | **Wang et al. (2017)** | **Markov et al. (2019)** | **Your Replication** |
|---|---|---|---|
| **Task paradigm** | Change detection (single-probe) | Continuous report (delayed estimation) | Continuous report (single randomly cued item) |
| **Software** | Custom Python scripts | PsychoPy (Linux Ubuntu) | Online (platform TBD) |
| **Monitor** | 21" CRT | Standard VGA | Participant's own |
| **Refresh rate** | Not specified | 75 Hz | Variable |
| **Resolution** | Not specified | 1024 × 768 | Variable |
| **Viewing distance** | 71 cm | ~47 cm | Uncontrolled |
| **Background** | Gray, RGB (128,128,128) | Homogeneous gray | Gray, `oklch(0.6 0 0)` |
| **Stimulus shape** | Colored triangles (features bound) | Triangles + circles depending on experiment | Oriented triangles **or** colored patches (single-feature objects, like Markov Exp 2) |
| **Stimulus size** | Not specified | Triangle sides 0.6°, 1.2°, 1.2° | Small, scaled to screen, kept near fixation so all items are visible without eye movements |
| **Color space** | CIE L\*a\*b\* | HSV (360°) | OKLCH |
| **Orientation space** | 8 fixed values (45° steps) | Continuous 360° | Continuous 360° |
| **Item locations** | 8 positions on two invisible circles | Imaginary circle, radius 4.35° | Invisible circle around screen center, equal angular spacing between items, random rotational offset of the whole array |
| **Position jitter** | ±0.5° | ±30° (Exp 1, 3); ±15° (Exp 2) | None beyond array rotation; equal spacing rigidly preserved |
| **Cue display** | 1000 ms pre-cue | None | None |
| **Sample duration** | 1000 ms | 500 ms | **150 ms × number of items** (450, 600, or 900 ms) |
| **Retention interval** | 1000 ms | 1000 ms | 1000 ms |
| **Test display** | Single probe, until response | Color or orientation wheel, until click | Color or orientation wheel, until click |
| **Response method** | Keyboard | Mouse on wheel | Mouse on wheel |
| **Probing rule** | Single item probed | Probed dimension counterbalanced | Each item equally likely to be probed (enforced by code, not random sampling). In 3+1 trials this means the intruder has a 1-in-4 probing rate; in 3+3 trials, 1-in-6. |
| **Set sizes tested** | 2 and 6 items | 3 (Exp 1, 3); 6 (Exp 2) | 3, 4, or 6 items |
| **Trial conditions (per dimension)** | 2C2O, 2C6O, 6C2O, 4C6O, 6C4O, 6C6O | 5 sample types per experiment | **5 conditions per dimension:** 3-only, 4-only, 6-only, 3+1 (3 of one dim + 1 intruder of the other), 3+3. Both dimensions are run, so the 3+3 condition is shared between dimensions and effectively yields 40 trials total. |
| **Critical contrasts** | Fixed vs. variable dimension across set sizes | Independence under integration vs. separation | (1) **4-of-same vs. 3+1**: does adding 1 item of the other dimension hurt as much as adding 1 same-dimension item? (2) **3+1 vs. 3+3**: does scaling cross-dimensional load amplify the cost? |
| **Trials per condition** | ~60 per condition (Exp 1) | 47 per condition × 2 probed dims | 20 trials for single-dimension and 3+3 conditions; **80 trials for the 3+1 condition** (chosen so the rare intruder item still yields ~20 probes of itself, given its 1-in-4 probability of being cued) |
| **Total trials** | 540–720 | 470 | **320 trials + 10 practice** (8 mini-blocks × 40 trials, randomly drawn from trial pool). Practice = 1 trial per condition (5 conditions × 2 dimensions = 10). |
| **Block structure** | Blocked (Exp 1, 2); mixed (Exp 3) | Within-subject, mixed | Mixed: trial types randomly intermixed within mini-blocks |
| **Dependent measures** | Hit rate, FA, % correct | P_memory, SD (mixture model) | Absolute angular deviation per condition |
| **Analysis** | ANOVA + t-tests | Frequentist + Bayesian ANOVA (JASP) | Bayesian regression in `brms` comparing absolute deviations across conditions |
| **Participants** | 9, 10, 12 | 19–20 per experiment | 50 usable participants (recruit ~60–65 to allow for online exclusions) |
