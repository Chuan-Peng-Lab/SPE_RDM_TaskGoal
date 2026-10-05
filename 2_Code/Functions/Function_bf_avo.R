# Sequential Bayes-factor analysis for the association x task_type design.
#
# bf_aov(data, dv) accumulates participants one by one (1st, then 1:2, 1:3, ...)
# and, at each step, computes the Bayes factors of three effects on the
# dependent variable `dv`:
#   - the association main effect
#   - the task_type main effect
#   - the association x task_type interaction
# This is used for the Bayesian sequential sampling plan: data collection stops
# when the interaction BF10 reaches >= 10 or <= 0.1 (or at the maximum N).
bf_aov <- function(data, dv='acc') {
  set.seed(1234)   # fix the seed so the sequential BFs are reproducible

  subj_num <- base::unique(data$subj_idx)   # participant IDs in the data
  n <- base::length(unique(data$subj_idx))  # total number of participants

  # Vectors holding the accumulated BF of each effect (indexed by participant count)
  bfs_int <- base::rep(1, length(subj_num))         # association x task_type interaction
  bfs_association <- base::rep(1, length(subj_num)) # association main effect
  bfs_task <- base::rep(1, length(subj_num))        # task_type main effect

  # Loop over cumulative sample sizes: the i-th iteration uses participants 1..i
  for (i in base::seq_along(subj_num)) {
    if (i == 1) {
      next   # skip a single participant (models below need more data to be identified)
    }

    # Subset the data to the first i participants (sequential accumulation)
    data_i <- data %>% dplyr::filter(subj_idx %in% subj_num[1:i])

    # Null-model formula: DV ~ participant-only random effects
    # (each participant contributes one observation per condition cell,
    #  so participant random effects model the repeated measures)
    dv_formula <- stats::as.formula(base::paste(dv, "~ 1 + subj_idx + association:subj_idx + task_type:subj_idx"))
    # (commented out) simplest null model: participant intercepts only
    # dv_formula <- stats::as.formula(base::paste(dv, "~ 1 + subj_idx"))

    # Null model: no fixed effects of interest
    null_model <- BayesFactor::lmBF(
      dv_formula,
      data = data_i,
      whichRandom = "subj_idx",   # participant is the random factor
      rscaleFixed = 0.5,          # prior scale on fixed effects (medium)
      rscaleRandom = 1,           # prior scale on random effects
      iteration = 10000           # Monte Carlo iterations for the BF computation
    )

    # Model with the association main effect added
    model_association <- BayesFactor::lmBF(
      update(dv_formula, paste(". ~ . + association")),
      data = data_i,
      whichRandom = "subj_idx",
      rscaleFixed = 0.5,
      rscaleRandom = 1,
      iteration = 10000
    )

    # Model with the task_type main effect added
    model_task <- BayesFactor::lmBF(
      update(dv_formula, paste(". ~ . + task_type")),
      data = data_i,
      whichRandom = "subj_idx",
      rscaleFixed = 0.5,
      rscaleRandom = 1,
      iteration = 10000
    )

    # Model with both main effects (association + task_type)
    model_main <- BayesFactor::lmBF(
      update(dv_formula, paste(". ~ . + association + task_type")),
      data = data_i,
      whichRandom = "subj_idx",
      rscaleFixed = 0.5,
      rscaleRandom = 1,
      iteration = 10000
    )

    # Full model: both main effects plus their interaction
    model_int <- BayesFactor::lmBF(
      update(dv_formula, paste(". ~ . + association * task_type")),
      data = data_i,
      whichRandom = "subj_idx",
      rscaleFixed = 0.5,
      rscaleRandom = 1,
      iteration = 10000
    )

    # Bayes factors of each effect at the current cumulative sample size:
    #  - interaction: full model vs. main-effects model
    #  - association: main-effects model vs. task-only model
    #  - task_type:   main-effects model vs. association-only model
    bfs_int[i] <- BayesFactor::extractBF(model_int / model_main)$bf
    bfs_association[i] <- BayesFactor::extractBF(model_main / model_task)$bf
    bfs_task[i] <- BayesFactor::extractBF(model_main / model_association)$bf
  }

  # Collect the accumulated BFs into a tidy tibble (one row per cumulative N)
  aov_output <- tibble::tibble(
    bfs_association = bfs_association,
    bfs_task = bfs_task,
    bfs_int = bfs_int
  )

  print(aov_output)   # inspect the accumulated BFs
  return(aov_output)
}
