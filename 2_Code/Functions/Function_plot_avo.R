# Plotting function for the sequential Bayes factors (one panel per effect).
# `aov_output` is the tibble returned by bf_aov();
# `dv` selects which accumulated BF column to plot ("bfs_association",
# "bfs_task" or "bfs_int");
# `condition` is the title of the panel.
plot_aov <- function(aov_output, dv, condition) {

  # Reshape the output: add a participant-count column (n) and melt the three
  # BF columns into long format (Effect x Bayes_Factor)
  data_plot <- aov_output %>%
    dplyr::mutate(n = 1:nrow(.)) %>%    # cumulative sample size (x-axis)
    tidyr::pivot_longer(bfs_association:bfs_int, names_to = "Effect",
                        values_to = "Bayes_Factor") %>%
    dplyr::mutate(dplyr::across(where(is.double),
                                ~round(.x, digits = 2)))   # round numeric columns for display

  # Plot the accumulated BF of the selected effect against the sample size
  plot_obj <- data_plot %>%
    dplyr::filter(Effect == dv ) %>%    # keep only the requested effect
    ggplot2::ggplot(aes(x = n, y = Bayes_Factor)) +
    geom_point(size = 3) +              # one point per cumulative N
    geom_line() +                       # connect the points to show the accumulation
    geom_hline(aes(yintercept = log(1)), linetype = "dashed") +   # BF10 = 1 (no evidence)
    geom_hline(aes(yintercept = log(10)), linetype = "dashed") +  # BF10 = 10 (stopping threshold)
    labs(y = TeX("$\\BF_{10}$")) +      # LaTeX y-axis label (requires latex2exp)
    ggtitle(paste(condition)) +         # panel title (e.g. "Interaction (ACC)")
    theme(
      panel.background = element_blank(),                       # no gray panel background
      plot.margin = unit(c(1, 1, 1, 1), "cm"),
      plot.background = element_rect(fill = "white", color = NA),
      plot.title = element_text(size = 22,                      # title style
                                # family = "song",              # (commented out) Chinese font option
                                face = "bold",
                                hjust = 0.5,
                                margin = margin(b = 15)),
      axis.line = element_line(color = "black", linewidth = .5),  # classic axis lines
      axis.title = element_text(size = 18, color = "black",
                                face = "bold"),
      axis.text = element_text(size = 15, color = "black"),
      axis.text.x = element_text(margin = margin(t = 10)),      # space between ticks and axis
      axis.title.y = element_text(margin = margin(r = 10)),
      axis.ticks = element_line(size = .5),
      panel.grid = element_blank(),                             # no grid lines
      legend.position.inside = c(0.20, 0.8),                    # legend placed inside the panel
      legend.background = element_rect(color = "black"),
      legend.text = element_text(size = 15),
      legend.margin = margin(t = 5, l = 5, r = 5, b = 5),
      legend.key = element_rect(color = NA, fill = NA)
    )

  return(plot_obj)
}
