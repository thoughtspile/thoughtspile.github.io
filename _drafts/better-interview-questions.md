---
title: Improve any tech interview question — 6 ways
tags:
  - interviews
  - career
  - programming
date: 2024-01-10
---

When planning my JS interviews, I . (Not Sudheer's fault, these questions _do_ appear in interviewsquite often)

But first, what's wrong with questions like "what's a closure"? Aren't closures important for a JS developer? Well, yes, but...

- It's hard to answer based on experience. You're asking for a _definition_ of 
- It's easy to answer if you've been preparing. Anyone can look through a list top interview questions, memorize the definition ofclosure, and dominate the interview.
- No room for compromise.
- It's term-based. Different teams come up with their own terms for things all the time, and it might be especially confusing with non-native English speakers who are _not_ familiar with the original term.
- Not a conversation starter. You're not asking for an opinion, or anything remotely personal, so you're _unlikely_ to get anything actually interesting with this question.

So, can you do better? Sure thing. Today, I'll show you 6 (six!) ways to turn even the blandest of interview questions into something interesting.

## Coding problem

As an easy option, 
Why is it better? Unlike closed questions, coding tasks usually have several solutions.

```js
function queue(arr) {
  return { push: (el) => arr.push(el), pop:  }
}
```

Granted, coding challenges have their own trucks of worms

## Fix the bug

If writing code from scratch turns out to be too time-consuming, or if the candidates often turn your question in a direction you don't find especially useful, a great option is converting a basic coding assignment into a bugfix activity. Prepare a code snippet using the concept you want to probe, and add a bug caused by mis-application of this concept. 

```js

```

## Refactoring

For a final code-centric variation, let's try this as a refactoring question.

```js
function parseInteger(num) {
  let intPart = '';
  for (let i = 0; i < num.length && num[i] !== '.'; i++) {
    intPart += num[i];
  }
  num = Number(intPart)
  if (num > Number.MAX_SAFE_INTEGER || num < -Number.MAX_SAFE_INTEGER) {
    return NaN;
  } else if (num == num - num % 1) {
    return num
  }
  return NaN;
}
```


## Behavioral question

If you don't want to involve live coding in your interview (at this stage, or at all), you can instead go with a question relating to the candidate's experience — "Tell me about a time when you used X".

You should be careful with the top

## Pros & cons

What are the benefints and drawbacks of using OOP in JavaScript programs?

## Why?

---

