bf_aov <- function(data, dv='acc') {
  set.seed(1234)
  
  subj_num <- base::unique(data$subj_idx) 
  n <- base::length(unique(data$subj_idx)) 
  
  bfs_int <- base::rep(1, length(subj_num))
  bfs_association <- base::rep(1, length(subj_num))
  bfs_task <- base::rep(1, length(subj_num))
  
  for (i in base::seq_along(subj_num)) {
    if (i == 1) {
      next 
    }
    
    data_i <- data %>% dplyr::filter(subj_idx %in% subj_num[1:i])
    
    
    dv_formula <- stats::as.formula(base::paste(dv, "~ 1 + subj_idx + association:subj_idx + task_type:subj_idx"))
    # dv_formula <- stats::as.formula(base::paste(dv, "~ 1 + subj_idx"))
    
    # null model
    null_model <- BayesFactor::lmBF(
      dv_formula,
      data = data_i, 
      whichRandom = "subj_idx",
      rscaleFixed = 0.5,
      rscaleRandom = 1,
      iteration = 10000
    )
    
    # association 
    model_association <- BayesFactor::lmBF(
      update(dv_formula, paste(". ~ . + association")),
      data = data_i,
      whichRandom = "subj_idx",
      rscaleFixed = 0.5,
      rscaleRandom = 1,
      iteration = 10000
    )
    
    # task_type
    model_task <- BayesFactor::lmBF(
      update(dv_formula, paste(". ~ . + task_type")),
      data = data_i,
      whichRandom = "subj_idx",
      rscaleFixed = 0.5,
      rscaleRandom = 1,
      iteration = 10000
    )
    
    # association & task_type
    model_main <- BayesFactor::lmBF(
      update(dv_formula, paste(". ~ . + association + task_type")),
      data = data_i,
      whichRandom = "subj_idx",
      rscaleFixed = 0.5,
      rscaleRandom = 1,
      iteration = 10000
    )
    
    # interaction
    model_int <- BayesFactor::lmBF(
      update(dv_formula, paste(". ~ . + association * task_type")),
      data = data_i,
      whichRandom = "subj_idx",
      rscaleFixed = 0.5,
      rscaleRandom = 1,
      iteration = 10000
    )
    
    bfs_int[i] <- BayesFactor::extractBF(model_int / model_main)$bf
    bfs_association[i] <- BayesFactor::extractBF(model_main / model_task)$bf
    bfs_task[i] <- BayesFactor::extractBF(model_main / model_association)$bf
  }
  
  aov_output <- tibble::tibble(
    bfs_association = bfs_association,
    bfs_task = bfs_task,
    bfs_int = bfs_int
  )
  
  print(aov_output)
  return(aov_output)
}