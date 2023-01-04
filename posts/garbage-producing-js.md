---
title: Major Garbage Producers in JS
tags:
  - javascript
  - programming
  - performance
date: 2018-11-24 18:25:43
---


The reckless coding culture of JS favors producing garbage. In real life, if you're environmentally conscious (hey there, my European readers), you probably do all sorts of crazy thinks to cut down on garbage — reject plastic bags in a supermarket, recycle bottles, keep the paper garbage in a closet until the special paper-garbage truck comes on Thursday. But when it comes to JS, the general sentiment magically becomes "let's litter like crazy, then let the engine designers do their thing and come up with something to make that work at the speed of C". Apparently, there's only that much the poor guys can do.

Even if you do a quick complexity analysis here and there, and know your way around a profiler, hot garbage is going to bite you. It won't be a literal memory leak — occasionally garbage collector would come and clean up your mess — but it places strain on the user's PC resources, and in the worst case you might end up with a 10+ seconds GC pause.

It's time that we learn to stand up for ourselves. We should at least identify eco-unfriendly JS patterns, so that we know whom to blame. In this post, I describe three patterns that lead to excess garbage production, and give you an insight into static-memory JS programming — the kind you want to use in low-level hot code.

## Array method chains

Chaining array methods might be concise and functional, but it's a terrible memory buster. Count with me:

```js
const res = arr // Say we have   110 elements here
  .filter(e => e.user) // say, + 100 elements
  .map(e => e.user) //         + 100 elements
  .map(u => u.wealth || 0) //  + 100 elements
  .reduce((acc, wealth) => acc + wealth, 0); // all to get a number!
```

We've just allocated 300 elements across 3 arrays, while we only needed one numeric variable (what is it, around 8 bytes?).

### Less calls, larger functions

Just because you can write every operation as a one-liner arrow, does not mean you should. In the above case, we could rewrite the chain into a non-chain, removing intermediate arrays:

```js
const res = arr.reduce((acc, e) => {
  const wealth = (e && e.user) ? (e.user.wealth || 0) : 0;
  return acc + wealth;
}, 0);
```

As you can see in [this jsperf](https://jsperf.com/array-chains), this solution is several times faster than the excessively chained one.

Of course, this limits the reusability of individual transforms — but, honestly, when was the last time you used non-inline function in a map (`.map(mapper)`)? Programming is a way of tradeoffs.

### `for` loops

For especially hot functions, it makes sense to switch to good old `for` loops with index:

```js
let total = 0;
for (let i = 0; i < arr.length; i++) {
  const e = arr[i];
  if (e && e.user) {
    total += e.user.wealth || 0;
  }
}
```

Iterator-based for..of loops may be the stylish and concise choice here, but, depending on your browser, they may be as fast as the indexed version, or the slowest option, or be not supported at all. When you transpile the code into ES5, for..of loops turn into plain loops and naturally run at the same speed, but you should not assume this would always be the case. Also, the spec requires iterators to produce a new object at any iteration, which complicates the GC job instead of easing it.

## Defensive Cloning

This pattern is not as widespread in Redux community as it used to be in Flux / event bus times, but it's a case where a single statement can stall your program. I'm talking about `_.cloneDeep` and friends.

The premise of cloning is noble: you have no idea what the consumers will do to your object, but mutating them might break the other consumers' assumptions. **example** This is most prominent in middlewares and observables, because these patterns assume low coupling, and you have no idea where the object you create goes and what happens to it. If you hand each consumer a unique copy of the object, it can do no harm to others.

### Clone only what's necessary

The basic redux pattern with object spreads — using `{ ...state, user }` to overwrite a single property — is already a good enough solution. Even if you overwrite the most deeply nested property, you generally allocate only `O(log N)` new memory for an N-sized object. That is, if you have a 3-nested object with 6 properties at each level, you only create 3 new object per clone instead of 6^3 = 216. Much better!

### Use Immutable.js

Libraries such as Immutable.js give the consumers no way to mutate the original object. They also enable you to change the object in patches, with smaller memory pressure than the naive method. The drawback is that the syntax for working with Immutable objects is more verbose, especially if you're interfacing with plain JS objects, so this solution works best for apps developed from scratch. As an alternative, you could employ ES6 `Object.freeze`, but the browser support is not quite there yet.

Unfortunately, this option also imposes runtime performance cost for property access, which might not be the best thing to do out of pure cautiousness.

### Make up your mind about mutation

My favorite option here is not technological. Impose a global rule over your codebase: *do not mutate the objects you did not create.* Beat yourself on the fingers with a ruler when you do. Enforce this in code reviews. Explain the problem you're solving to your colleagues. If you absolutely must mutate the object, clone it as soon as you receive it. That's 1 explicit clone per 100 calls, not the default case. Much better.

## Object arguments

This one is primarily for designing hot-utility libraries. The guys often opt for ease of use and design APIs with `options` argument that accepts an object:

```js
// Ugly and inflexible (or is it?)
formatGreeting('Waldemar') // hello, Waldemar!
// You don't have to remember arg position! And we can add more options later.
formatGreeting({ name: 'Waldemar' }) // hello, Waldemar!
```

It's all very nice and convenient until you realize that you have to create an object on every call, then throw it away. Here's [another jsperf](https://jsperf.com/object-vs-positional-args) that shows just how big a hit this can be.

Make a rule of accepting required arguments positionally in hot utility functions. You can always reserve the last position for an optional argument object a-la python to allow your users to opt-in to extended functionality:

```js
formatGreeting('Waldemar', { lang: 'fr' }) // Bonjour, Waldemar!
```

---

I know, I know, your favourite quote starts with "premature optimization" and ends with "evil". However, if you don't take these things into consideration when writing low-level code, you'll soon find your validations take 400ms per keyword stroke, your visualizations hang the browser, and your node server do GC pauses every other second. I'm not promoting the use of these techniques in all your code, but as soon as you recognize a code path is hot — go for it! At least you'll know what to look for. Good luck!
