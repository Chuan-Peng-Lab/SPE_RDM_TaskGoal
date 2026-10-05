### This script creates an R function to generate raincloud plots, then simulates
### data for plots. If using for your own data, you only need lines 1-80.
### It relies largely on code previously written by David Robinson
### (https://gist.github.com/dgrtwo/eb7750e74997891d7c20)
### and the package ggplot2 by Hadley Wickham

# Check if required packages are installed ----
packages <- c("cowplot", "readr", "ggplot2", "dplyr", "lavaan", "Hmisc")
if (length(setdiff(packages, rownames(installed.packages()))) > 0) {
  install.packages(setdiff(packages, rownames(installed.packages())))
}

# Load packages ----
library(ggplot2)

# Defining the geom_flat_violin function ----
# Note: the below code modifies the
# existing github page by removing a parenthesis in line 50

# Small helper: return a if it is not NULL, otherwise return b
# (used below to fall back to default values)
"%||%" <- function(a, b) {
  if (!is.null(a)) a else b
}

# The user-facing geom function: a half violin drawn only on one side,
# used to build raincloud plots (half-violin + boxplot + raw points)
geom_flat_violin <- function(mapping = NULL, data = NULL, stat = "ydensity",
                             position = "dodge", trim = TRUE, scale = "area",
                             show.legend = NA, inherit.aes = TRUE, ...) {
  layer(   # register the custom geom as a ggplot2 layer
    data = data,
    mapping = mapping,
    stat = stat,              # density estimation along the y axis
    geom = GeomFlatViolin,    # the ggproto object defined below
    position = position,
    show.legend = show.legend,
    inherit.aes = inherit.aes,
    params = list(
      trim = trim,            # whether to trim the density to the data range
      scale = scale,          # how violins are scaled ("area" = equal area)
      ...
    )
  )
}

#' @rdname ggplot2-ggproto
#' @format NULL
#' @usage NULL
#' @export
GeomFlatViolin <-
  ggproto("GeomFlatViolin", Geom,   # define the new geom as a subclass of Geom
    setup_data = function(data, params) {
      # Determine the half-violin width: use the user-provided width,
      # otherwise fall back to 90% of the x-axis resolution
      data$width <- data$width %||%
        params$width %||% (resolution(data$x, FALSE) * 0.9)

      # ymin, ymax, xmin, and xmax define the bounding rectangle for each group
      # (the flat violin only spans x to x + width/2, i.e. one side of the axis)
      data %>%
        group_by(group) %>%
        mutate(
          ymin = min(y),
          ymax = max(y),
          xmin = x,
          xmax = x + width / 2
        )
    },

    draw_group = function(data, panel_scales, coord) {
      # Find the points for the line to go all the way around
      # (outline runs from the axis outward and back)
      data <- transform(data,
        xminv = x,
        xmaxv = x + violinwidth * (xmax - x)
      )

      # Make sure it's sorted properly to draw the outline:
      # one path upward along the inner edge, one downward along the outer edge
      newdata <- rbind(
        plyr::arrange(transform(data, x = xminv), y),
        plyr::arrange(transform(data, x = xmaxv), -y)
      )

      # Close the polygon: set first and last point the same
      # Needed for coord_polar and such
      newdata <- rbind(newdata, newdata[1, ])

      # Draw the polygon (delegates to the standard polygon drawing method)
      ggplot2:::ggname("geom_flat_violin", GeomPolygon$draw_panel(newdata, panel_scales, coord))
    },

    draw_key = draw_key_polygon,   # legend key shown as a filled polygon

    default_aes = aes(             # default aesthetics of the geom
      weight = 1, colour = "grey20", fill = "white", size = 0.5,
      alpha = NA, linetype = "solid"
    ),

    required_aes = c("x", "y")     # the geom needs x and y
  )