---
title: How to increase test coverage FAST
tags:
    - testing
    - programming
date: 2021-05-31
---


The second quarter is coming to an end. I suppose a lot of my fellow developers are struggling to meet their ambitious KPI of "20% more test coverage". Fear not — I'll show you a couple of neat tricks that will up your coverage game in no time, so that you can go on with your life (a handy bonus for meeting your goals and exceeding all expectations warranted).

## Verbose code is bro

When it comes to cope coverage, verbose code covered with tests is your best friend. Compare the following snippets:

```js
// not bro
const isEvenBad = x => x % 2 === 0;
// bro
function isEvenBro(x) {
    let counter;
    if (x < 0) {
        counter = -x;
    } else {
        counter = x;
    }
    while (counter > 0) {
        counter -= 2;
    }
    if (counter === 0) {
        return true;
    } else {
        return false;
    }
}
```

These functions do the same thing. The key difference is that the first one, when fully tested, gives you just 1 covered line, while the second one is 140% better with 16! Moreover, if you write new tests for the second function, you'll earn a lot of credit with the team for maintaining such a complicated piece of code.

If you notice a co-worker rewriting a well-tested function into a simpler version, make sure to reject his pull request — lowering test coverage and "not understanding the whole complexity" are two great objections.

## Choose the right metrics

The next point is quite obvious — if you measure several coverage metrics, report the highest one. Usually, function coverage is the one to use, while conditional / branch coverage is normally lower and should not be mentioned. It's not to say that it's not helpful at all — you can refer to its value at the start of the quarter to impress your boss! Learn the formula "We went from 20% _(branch, of course)_ coverage to 60% (_function coverage_) in just 3 months". Make sure to include a screenshot of a coverage report with a lot of green stuff in your PowerPoint presentation.

Another great trick is to exclude untested code from coverage calculations. [Jest](https://jestjs.io) is an amazing tool that does it by default for JS — only the code that is imported in your tests takes is taken into account.

## Decompose the smart way

So, function coverage is the right metric to report — but how to increase it? You might naively think that fewer function = better, since stuffing your code into one huge function and testing it yields 100% coverage. That's the spirit, but cramming all the code into a single function is difficult for modern programs. Instead, use the 2 patterns:

- Find a well-tested function, and split it into as many functions as possible — every one is +1 covered function! Make sure to cal it "decomposing".
- Look for functions that are not tested and try to stick their code into the tested ones.

## Write generic tests

I heard modern test frameworks come with lots of differnt assertions — you can compare things, test them with regexes and what not. I don't know who came up with that, but you only need one assertion: _function X does not throw._ It'll give you the same coverage as the other types, but is easier to write and less likely to break. A perfect test case for our `isEvenBro` would be

```js
expect(() => isEvenBro(2)).not.toThrow();
```

So just take a function, stick some arguments that don't make it explode, and call it a day. Oh, and if it does explode, you can add an `expect(...).toThrow()` as a corner case test.

## Configuration over code

Conditionals are bad, because they lower branch coverage. In a perfect world, you'd be working with

```js
return ifElse(x > y, x, y);
// not some
return x > y ? x : y;
```

See? The first version has 0 branches, and you can get 100% coverage with 2 tests for `ifElse` helper.

If a co-worker of yours is a traitor and doesn't like `ifElse`, try something less in-your-face:

```js
// Good pattern to replace switch {}
const months = ['January', 'February', ...];
const monthName = mNumber => months[mNumber];
```

Oh, and while we're at it, a great place for front-end devs to hide the conditionals is CSS:

```css
.Input[data-active=true] { color: black }
/* setAttribute('data-active', isActive) */
```

## Don't test if you are not obliged to

The final thing is what I call strategic thinking. Writing tests is easier when you have fewer tests. In the next quarter, avoid promising anything test-related, and just code happily and freely, like a bird, without the tests to slow you down. By the time you commit to another "20% more test this quarter" you'll hopefully have a lot of untested code waiting around for you to meet your goals.

---

On a more serious note, though:

1. Stop being so fucking serious about code coverage.
2. Coverage is a bad KPI, don't use it just because it's the easiest quality metric to measure.
3. Havig X% coverage only tells you that X% of your code does not throw under _some_ conditions.
4. When you do talk about X% coverage, make sure it's the _lowest_ metric measured on your _whole_ codebase (especailly when X=100).
5. Code-as-configuration flies under the radar of most coverage metrics, be careful with it.

Coverage is a tool to help you find missed requirements that are described in your code, not an end goal.
