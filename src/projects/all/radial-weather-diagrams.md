---
title: Radial weather diagrams with d3
type: project
---
[Go and play with it](http://thoughtspile.github.io/radial-weather/vis.html), then come back if you wish to know my motivation and boring statistical details. It's a *nice* project.

This is my first d3 project that does not put me to shame with its looks. Grabbed some open weather data and laid it out in a circle. Why would I do that? Circles look *nice*, can be put on a map easily and make periodic movements easily visible without cutting in an arbitrary location. The *nice* looks above all, definitely.

I started out by warping the data around a center, which already looked *nice* but didn't make anything clear. Removing the daily variation (days are generally hotter than nights) helped. Note: daily mean is fine, but wouldn't it be *nice* to have more control? Daily highs, lows, quantiles, mean between 2 and 5PM, all valid use cases.

The graph still looked like a bunch of circles and it was not apparent at all that winter is cold, leave alone the more gentle variations. So I snapped on a grid (a radial grid) and it got better once again. Once the data was segmented, I importanted the categories with color highlights. This makes sense: who cares if the temperature is 19.5 or 20.43 degrees? It's either warm or cold. (Or hot, or super-hot, or freezing. Given the subjectivity of that stuff, having some control over these categories would be *nice*, too.)

The lines overlap and hide behind each other and it's not *nice* at all. Enter spirals! Sadly, when you lay out the value plot in a spiral the radius per layer (one layer per period) becomes squished and it's even less clear now what's going on. But why, my data happens to have a *nice* categorical counterpart! Why not throw out the values altogether?

Now let's assume that we don't want to know anything about the years. Both 2005 and 2006 were long ago, why would anyone care? The tiles of one category are stacked, leaving us with a *nice* flow plot.

The project is *nice*, and I'm looking forward to getting back to it someday.
