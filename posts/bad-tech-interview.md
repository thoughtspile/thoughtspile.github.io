---
title: 5 coding interview questions I hate
date: 2022-03-21
tags:
  - javascript
  - interview
---

I’ve taken part in well over a hundred tech interviews now, on both sides. Some were fun, and some were pure cringe. I’ve been asked if I have kids (supposedly, people with children won’t have time to job hop), and if “I bet my ass I cost that much”. Fun times.

But today I’d like to talk about cringe tech interview question posing as valid ones. They’re on topic, but they do nothing but annoy and frustrate the candidate. Some are beyond saving, while some are fine, but often mishandled by the interviewer. Here are the main offenders:

- What happens if you build a circular prototype chain? And other intervew trivia.
- How to migrate from webpack 3 to webpack 5? And other specifics.
- What’s the difference between a number and an array? And other questions obfuscated with fuzzy wording.
- What’s the fastest way to convert a string to number? And other unspecified behavior.
- How to make this code sample _better_? And other questions with missing context.

I’ll share tips both for the interviewers to spend their time better, and for the candidates who hit some of these. Let’s go!

## Trivia

This first category comprises questions that are popular in interviews, but rarely arise in practice. What happens when we run the following code?

```js
const x = {};
const y = {};
x. __proto__ = y;
y. __proto__ = x;
console.log(x.field);
```

We modify the prototype chain in runtime to make it circular. You’ve probably guessed the answer is “nothing good”. You’d never write code like this in production. What a maniac would use [the ad-hoc standardized and since deprecated `__proto__` property?](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/proto)) Of course, the “correct” answer is that `y. __proto__ = x` throws `TypeError: Cyclic __proto__ value`, thanks, that’s good to know.

These questions only show how many interviews the candidate has been in, and it’s in case you’ve picked a popular question. If you’ve just come up with a “tricky question that’s not on the web” yourself, it’s just a dice roll of spec memorization.

Old-style JS questions are a notable sub-category of trivia. Yes, those of us who started programming back before 2015 know how `var` hoisting works, and how to declare (and even extend) a class with `.prototype` Here, you’re effectively testing when the developer started learning JS (or if he’s worked on a legacy codebase), which is already on the CV. _Maybe_ worth it if you have a legacy project yourself.

As an interviewer, avoid questions that have nothing to do with the real-life development. The biggest fans of these questions are non-technical people (CEOs, founders, PMs) trying to conduct coding interviews by going over a question list found online. Bad news — it doesn’t work like that. Either hire / borrow a real developer just for the interviews, or stick to soft-skill topics and experience anecdotes.

The only way to answer these is, sadly, to participate in many interviews — or, as a cheap substitute, to browse lists of “TOP JS questions ever, guaranteed”. No one can realistically know every corner case of the language and the libraries.

## Specifics

What issues does migrating to webpack 6 have? How do you check browser support for server-sent events? What `aria-role` should a modal page have? I don’t know. I usually google for this kind of things, and I’m pretty good at it.

This is what happens when you take my advice on using _real-life programming_ questions a bit too seriously, and drop random problems you recently solved into an interview. Obviously, you’ve made your research, figured out the answer, and are pleased with yourself. But I’m not you, we have different experience to complement each other — and isn’t that even better? Don’t label me as an _idiot_ just because I’ve never touched a certain area of web development.

Instead, ask the candidate about a challenging problem _she_ recently solved — it’s going to be far more entertaining and valuable for both of you.

If you’re asked this question, and have never faced the problem yourself, you’re in trouble. Try to access all the background knowledge around the topic you might have, and _maybe_ you can even figure this out based on common sense.

## Obfuscated questions

“What’s the difference between a number and an object” is the most surprising question ever — double the surprise every time I hear it yet again. Come on, what’s the difference between your head and a sweet potato fresh out of oven? Excuse me, am I interviewing for a comedian?

The problem here is that a very concrete answer is expected (I figured out it’s “number is immutable”), but asking it directly is “too simple”, so you dress it up by presenting it as open-ended, and add some fuzziness, but in the end it just becomes impossible to decipher what you were trying to ask in the first place.

The worst part is that you can’t even give a hint, because the hint is the answer, so you’re bound to circle around confusing everyone further. “What can you do with numbers that you can’t with objects?” (Add them? Coerce to `false`?). “Think again, do numbers have properties?” (in [a way,](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) they do). What a waste of time!

Again, interview experience is key here. Once you wrap your head around the [common JS interview questions](https://dev.to/macmacky/70-javascript-interview-questions-5gfi) and topics, you’ll get better at recognizing them whatever costume they’re dressed in.

As an interviewer, prefer direct questions (“Which JS types are immutable?”) or at least make sure your wording points in the intended direction, not all over the place (“What’s the difference between primitive types and objects?”).

## Unspecified behavior

Will `console.log(Object.keys({ x: 0, y: 0 }).join())` log `x,y` or `y,x`? Is `x[key]` faster than `x.find(e => e.key === key)`? Under normal circumstances I know the answers are `x,y` (addition order) and _yes,_ but it’s not on the spec, so I wouldn’t over-rely on it.

Performance-related questions are the most popular of this bunch. JS runtimes change fast, and even if you’ve seen some code perform better a few years ago, it might not be the case any more. The fact that built-in data structures in JS do not specify operation complexity does not help either. We reasonably _assume_ object access `obj[key]` to take _O(1),_ but in reality this depends on many factors — object size, insert / remove frequency, whether the keys are string literals (see [benchmark](https://esbench.com/bench/62385aeb6c89f600a57016a7)). And even when the difference does exist, it’s usually abysmal and irrelevant to actual front-end development.

Overall, these questions are good for assessing both the practical knowledge of the common-case performance, the difference between runtimes, _and_ how it applies to everyday development. As an interviewer, you only need two things to handle this well: be aware of the implementation-dependence yourself and have an open mind when it comes to unexpected answers. These questions are certainly _not_ suitable for a non-interactive interview, such as a single-choice online survey (Pick the fastest method: a) `a.pop()` b) `a.shift()` c) `a.length -= 1`), because there’s no one right answer here.

## Missing-context questions

Open-ended questions are among the best you can ask in an interview — they’re challenging, and reveal both the candidate’s problem-solving skills and real-world experience. However, these questions are unforgiving to lazy interviewers — both sides should put in some effort to make them work. The two prime ways to mess these up are being uncollaborative and locking in to one possible solution.

For example, what’s wrong with this function?

```js
function map(arr, fn) { 
  for (var i = 0; i < arr.length; i++) { 
    arr[i] = fn(arr[i]); 
  }
  return arr;
}
```

Why, looks perfectly fine to me. Or maybe not. Depends on what you’re trying to achieve. The code is rarely “right” or “wrong” by itself. Yes, mutating `arr` is non-idiomatic lately, but maybe it works in-place as an optimization. Yes, the use of `var` is frowned upon, but maybe it’s a library that’s supposed to work in IE6. Yes, we could replace the `for (;;)` with a `.map` or a `for..of`, but then we’d lose support for all array-likes. See, it all depends on the context. I can endlessly produce variations of this code, but I’d rather not if it’s not causing any trouble.

This question is often presented as “refactor this code to make it BETTER” — sure to excite any junior developer. Good thing grumpy old Vladimir is here to tell you that “refactoring” with no clear goal is the greatest waste of time out there.

To illustrate the solution lock-in problem, suppose you give me a slider gallery implemented with a horrendous mess of jQuery and ask to _improve_ it. Problem is, you believe the best way to spend an hour on this is to write unit tests and convert to React. I think I should change jQuery to vanilla DOM and improve UX with better overscroll handling. Neither of us is right or wrong. In real life, the project goals and technical direction sets the context — how many jQuery dependencies we have across the codebase, if we intend on migrating to React, manual QA availability.

When asking an open-ended question, either let go of your expected answer and focus on the problem-solving process, or introduce the missing requirements to guide towards your desired solution.

* * *

So, here are the five types of interview questions that I hate, most hopeless to nice-but-dangerous:

- Trivia: questions that often arise in interview, but never in real life, e.g. “what happens if you create a circular prototype chain”. These test for interview experience, not development skills. Avoid.
- Specifics: solutions to unique real-life problems. Example: “how to migrate webpack 3 to webpack 5”. _Might_ work if the answer can be from the expected background knowledge or if the area is super critical to your product. Instead, ask about a challenging problem the candidate recently solved.
- Obfuscated questions: simple questions made _harder_ by fuzzy wording, such as “what’s the difference between a number and an object?” instead of “are JS numbers mutable?”. Avoid.
- Implementation questions: the answer depends on a specific JS runtime, e.g. “what’s the fastest way to loop over a list”. Avoid strong wordings and don’t bikeshed if the answer is not what you expected.
- Missing context: answer requires additional details, e.g. “how to improve this code”. Amazing question as long as you’re ready to problem-solve together, provide the missing constraints and give credit for noting the distinct possibilities. Worst question if you expect a specific question while many objectively good alternatives exist.

Here’s my advice on improving interview questions, as a nice flowchart:

![](https://thoughtspile.github.io/images/interview-guide.png)

For candidates, I’m afraid, I have fewer actionable tips. Sure, practice makes perfect, and skimming the common interview questions won’t hurt even if you’re a hot shot lead senior, but other than that it’s hard to escape a bad question with an bad interviewer. You can’t convince the interviewer to change the question or his approach on the fly (if you can, apply for a top-tier sales representative position instead). Tough luck, but be ready to admit you don’t know some things, and try to work from the knowledge you have around the topic.

Good luck with your interviews, and see you later!
