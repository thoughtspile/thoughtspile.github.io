---
title: Procedural terrain generator
type: project
---
You'd rather browse the [demo](http://thoughtspile.github.io/terragen/) than read this thought pile! Zoom with mouse wheel, rotate with LMB and move with RMB.

At some point I became fairly excited about procedural content. This project started out as a bunch survey of coherent noise generation methods. I have tried

- [Fault line](http://www.lighthouse3d.com/opengl/terrain/index.php?fault) algorithm. You pick a random line and move a half-surface at one side up or down. Any point can be affected (with 1/2 chance) by any modification, so there's no easy way to only load some area. Producing decent-looking terrain actually takes loner than other algorithms, and you get very little control. However, the simplicity is nice.
- [Hill-raising](http://www.stuffwithstuff.com/robot-frog/3d/hills/hill.html). The idea is very similar: you pick a point, insert a function with a maximum at the point and raise the terrain wherever the function is positive. Any modification is local, and by varying the function you can get nice effects. Scaling the function (smaller area, smaller offset) makes the terrain fairly realistic.
- [Diamond-square](https://en.wikipedia.org/wiki/Diamond-square_algorithm). A simplistic algorithm where you take a grid of points and randomly offset them, starting at the corners, with decreasing amplitude. The algorithm works best for filling a fixed 2D array of heights, then leaving it alone.
- Smooth value noise.
- Gradient Perlin noise.

Then I got carried away with the 3D stuff. I went mad and disposed of the methods unsuitable for real-time generation. I implemented tiling, scrolling and zooming. By that time my 2-week-in-a-row time limit for personal projects had ended and I had to leave it where it is now, hoping to improve on it someday.
