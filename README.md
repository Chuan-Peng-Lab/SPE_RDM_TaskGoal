# Task Goals Modulate Self-Prioritization Effect

This repo contains the experimental program and data analysis code for the study *"Task Goals Modulate the Processing Advantage of Newly Acquired Self-Relevance in Perceptual Decision-Making"*.

## Research Background and Aims

The self-prioritization effect (SPE) refers to the phenomenon whereby self-related stimuli are processed more efficiently than stimuli not related to the self. In the classical self-matching task, the SPE usually emerges when distinguishing self- and other-relevant stimuli is the task goal, but it diminishes or disappears when the task goal shifts to physical stimulus properties. Whether the *underlying decision processes* are also modulated by task goals, however, remains unknown from overt RT and accuracy measures alone.

To address this, we combined a **two dimensional random-dot kinematogram (RDK) task** (perceptual dimensions: shape, square/circle; and color, red/blue) with a **modified self-matching task**. Participants first learned to associate one shape (or one color) with the self and the other with another person, and then performed choice tasks in which the learned association was manipulated to be:

- the **task goal** itself (identity-choice task: judge whether the dot array represents self or other),
- **relevant** to the task goal (identity-relevant task: judge the feature dimension that was associated with identity), or
- **irrelevant** to the task goal (identity-irrelevant task: judge the feature dimension that was *not* associated with identity).

Behavioral data (RT, accuracy) were analyzed with Bayesian mixed-effects models and hierarchical drift-diffusion modeling (HDDM) to decompose the effects into evidence-accumulation efficiency (drift rate *v*) and response bias (starting point *z*).

## Experimental Design

**2 × 3 within-subjects design:**

- **Within-subject factors**
  - `Association type`: self vs. other
  - `Task type`: identity-choice vs. identity-relevant vs. identity-irrelevant
- **Dependent variables**: RT and accuracy

**Task procedure:**

1. **Adaptive staircase task** (shape and color)
2. **Association learning session**
3. **Choice task**: three subtasks (identity-choice / shape-choice / color-choice)

**Sampling plan:** a Bayesian sequential design was used to determine the sample size, with the association × task-type interaction as the key hypothesis. 

The experiment was programmed with jsPsych v7.3.1, deployed on GitHub Pages, and conducted online.


## Folder Structure

```
SPE_RDM_TaskGoal/
├─ 1_Procedure/
│ └─ JsPsych/                    # jsPsych v7 experiment
│    ├─ img/                     # Stimulus label images (self/he/she/card, color-blindness plates)
│    ├─ jspsych-7.0/             # jsPsych library + custom plugins (rdk, staircase, virtual-chinrest, ...)
│    ├─ template_Expt/
│    │ ├─ color.js               # Color-choice task (staircase + formal task)
│    │ ├─ shape.js               # Shape-choice task (staircase + formal task)
│    │ └─ getThreshold.js        # Adaptive staircase procedure
│    └─ index.html               # Main experiment page
├─ 2_Code/
│  ├─ Data_clean.Rmd             # Preprocessing of raw data
│  ├─ SBFA_SPE.Rmd               # Sequential Bayes factor analysis for sample-size determination
│  ├─ BHM_Analysis.Rmd           # Bayesian hierarchical (mixed-effects) model analysis (brms)
│  ├─ HDDM/
│  │ ├─ analysis.ipynb           # HDDM model fitting + posterior predictive checks
│  │ └─ plot.ipynb               # Posterior visualization (v, Δv, z) and 95% HDI summaries
│  └─ Functions/                 # Helper functions (BF computation/plots, raincloud plots)
└─ 3_Data/
   ├─ RawData/                   # Raw per-participant data
   └─ CleanData/                 # Cleaned per-participant data + aggregated datasets
```

## Getting Started

### Prerequisites

- **For running the experiment:** a web server or any jsPsych-compatible environment.
- **For behavioral analyses (R):** R ≥ 4.3.3 with `brms`, `cmdstanr`, `BayesFactor`, and a working C++ toolchain for Stan.
- **For drift-diffusion modeling (Python):** a dockerHDDM environment (HDDM 1.0.x , `kabuki`, `arviz`).

### Suggested workflow

1. Run `2_Code/Data_clean.Rmd` to build the clean datasets from `3_Data/RawData/`.
2. Run `2_Code/SBFA_SPE.Rmd` to reproduce the sequential Bayes factor analysis.
3. Run `2_Code/BHM_Analysis.Rmd` for the Bayesian mixed-effects model results.
4. Run `2_Code/HDDM/analysis.ipynb` to fit the HDDM models, then `2_Code/HDDM/plot.ipynb` to generate the posterior figures.

> Note: relative paths inside the scripts may need to be adjusted to match your local folder layout.

For questions regarding the experimental program or the analysis code, please open an issue in this repository.
