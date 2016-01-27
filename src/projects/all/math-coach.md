---
title: Math coach
type: project
---
A <a href='http://thoughtspile.github.io/math-coach' target='_blank'>web app</a> for practicing simple arithmetics. It has a challenge mode and can generate worksheets with configurable complexity. This is one of my simpler projects, yet probably the cleanest and the most complete.

It started out with a simple node script. Occasionally I tend to teach some math to some kids. It often involves quickly coming up with some simple problems, which is not hard, but tedious. You start with a really simple (think 7th grade) model of a word problem. You then take some plausible answer not to end up with a cyclist travelling at the speed of light and apply the model backwards to get the conditions you feed to your student. You inevitably screw up and get a bunch nth roots, putting your pedagogical skills to shame. Am I not a software developer? Math coach to the rescue.

The app uses expression trees to control the value of each subexpression: I can force it to be integer, positive, between 10 and 20 or whatever. This model is extensible to proper fractions, matrices, complex numbers or any other kind of crazy mathematical constructs.

Once I put some UX engineering into play, I couldn't help but building a simple game on top of this marvelous little gem of a library. It definitely needs more work, but already feels quite pleasant.
