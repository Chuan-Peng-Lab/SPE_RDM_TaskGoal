# 绘图函数，用来绘制主效应的图
plot_aov <- function(aov_output, dv, condition) {
  
  data_plot <- aov_output %>% 
    dplyr::mutate(n = 1:nrow(.)) %>% 
    tidyr::pivot_longer(bfs_association:bfs_int, names_to = "Effect", 
                        values_to = "Bayes_Factor") %>% 
    dplyr::mutate(dplyr::across(where(is.double), 
                                ~round(.x, digits = 2)))
  
  plot_obj <- data_plot %>% 
    dplyr::filter(Effect == dv ) %>% 
    ggplot2::ggplot(aes(x = n, y = Bayes_Factor)) + 
    geom_point(size = 3) + 
    geom_line() + 
    geom_hline(aes(yintercept = log(1)), linetype = "dashed") +
    geom_hline(aes(yintercept = log(10)), linetype = "dashed") +
    labs(y = TeX("$\\BF_{10}$")) + 
    ggtitle(paste(condition)) +  
    theme(
      panel.background = element_blank(),
      plot.margin = unit(c(1, 1, 1, 1), "cm"),
      plot.background = element_rect(fill = "white", color = NA),
      plot.title = element_text(size = 22, 
                                # family = "song",
                                face = "bold",
                                hjust = 0.5,
                                margin = margin(b = 15)),
      axis.line = element_line(color = "black", linewidth = .5),
      axis.title = element_text(size = 18, color = "black",
                                face = "bold"),
      axis.text = element_text(size = 15, color = "black"),
      axis.text.x = element_text(margin = margin(t = 10)),
      axis.title.y = element_text(margin = margin(r = 10)),
      axis.ticks = element_line(size = .5),
      panel.grid = element_blank(),
      legend.position.inside = c(0.20, 0.8),
      legend.background = element_rect(color = "black"),
      legend.text = element_text(size = 15),
      legend.margin = margin(t = 5, l = 5, r = 5, b = 5),
      legend.key = element_rect(color = NA, fill = NA)
    )
  
  return(plot_obj)
}