---
title: A critical look at DRY principle
tags:
  - frontend
  - programming
date: 2023-01-18
---

As programmers, we're taught early in our career to not repeat ourselves (aka [DRY principle](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself)). It's probably the easiest common "clean code" practice to follow, because anyone can call a function instead of copy-pasting it. It's also objective, as opposed to naming or decomposition — 

Don't get me wrong — reusing code is usually better than copy-pasting it. However, when applied thoughtlessly, DRY can create more problems than it solves. In this article, we will first take a look at the actual practical benefits of DRY, instead of "that's what we _MUST_ do". Then we'll go over signs that you're taking DRY too far.

## Why DRY is good

The first and most obvious benefit is that you don't spend time building stuff that's already been built and tested. I think we can all agree that useless work should be avoided. If you're choosing between using `floating-ui` and spending a week writing complicated positioning code, it should be a no-brainer.

Then, you get free maintenance. When you add some functionality, or fix a bug, in a reused function, every "consumer" is updated (fixed) for free. When you have multiple copies scattered across your codebase, updates become harder, and you're likely to miss some instances. Over time, the instances completely diverge, making change harder yet.

Also, it's much easier to ensure two code pieces work the same way when they are a single function than when they are random pieces of code lying all around. The consequences of a mismatch can vary: it can be a minor inconvenience — say, different user avatars on diffent pages, or a full-scale disaster, like a cyclical redirect on a signin page. The worse the consequences, the more important DRY is.

DRY reduces the amount of information a developer needs to keep in mind. It's much easier to remember a single function, `formatDate`, its options and limitations, than it is to keep a suite of `dayFromISO`, `recentTime(timestamp)`, scattered across the codebase.

Another benefit of DRY is that duplicate code will normally increase the size of your compiled application more than reusing a single function. It's mostly applicable to front-end development where bundle size is pretty important.

So far, the benefits of DRY are convincing. What can the drawbacks of such a marverl be?

## Overcomplicating base code

It's all good and fine when the candidate base completely covers 

## Time-consuming generalization

## Infinite layering

## Hadrer change

### Increased _criticality_


## Taking it beyond what's reasonable

---