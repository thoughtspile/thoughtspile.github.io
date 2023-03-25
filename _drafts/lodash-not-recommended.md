---
title: Lodash in 2023? Not recommended.
tags:
  - frontend
  - javascript
  - programming
date: 2023-03-11
---

In the world of JS libraries, [lodash](https://github.com/lodash/lodash) is a champion. 

![Lodash](/images/lodash-popularity.png)

https://npmtrends.com/@babel/core-vs-express-vs-lodash-vs-ramda-vs-react

But in 2023, I can't recommend new projects to 

## Issues with lodash

### Size issues

### Conservatie browser target

### Excessive polymorphism

## Alternatives

### Built-in ES methods

Lodash has, incredibly, over 300 helpers. It's been around since 2012, and has been _very_ conservative about removing features, so many, naturally, come built-in with modern ES standards.

- Most array methods are in the core, with very similar names:
  - `_.compact(arr) -> arr.filter(Boolean)`
  - `_.concat(arr, arr2) -> arr.concat(arr2)`
  - `_.difference(arr, arr2) -> arr.filter(x => !arr2.includes(x))`
  - `_.drop(arr, 5) -> arr.slice(5)`
  - `_.dropRight(arr, 5) -> arr.slice(0, -5)`
  - `_.fill(arr, 'x') -> arr.fill('x')`
  - `_.findIndex(arr, x => x > 2) -> arr.findIndex(x => x > 2)`
  - `_.findLastIndex(arr, x => x > 2) -> arr.findLastIndex(x => x > 2)`
  - `_.flatten(arr) -> [].concat(...arr)`
  - `_.fromPairs([['key', 'value']]) -> Object.fromEntries([['key', 'value']])`
  - `_.head(arr) -> arr[0]`
  - `_.indexOf(arr, item) -> arr.indexOf(item)`
  - `_.initial(arr) -> arr.slice(0, -1)`
  - `_.difference(arr, arr2) -> arr.filter(x => arr2.includes(x))`
  - `_.join(arr, ', ') -> arr.join(', ')`
  - `_.last(arr) -> arr.at(-1)`
  - `_.lastIndexOf(arr, item) -> arr.lastIndexOf(item)`
  - `_.nth(arr, 10) -> arr.at(10)`
  - `_.reverse(arr) -> arr.reverse()`
  - `_.slice(arr, 1, 3) -> arr.slice(1, 3)`
  - `_.tail(arr) -> arr.slice(1)`
  - `_.take(arr, count) -> arr.slice(0, count)`
  - `_.takeRight(arr, count) -> arr.slice(-count)`
  - `_.union(arr1, arr2) -> [...new Set([...arr1, ...arr2])]`
  - `_.uniq(arr) -> [...new Set(arr)]`
- Many object methods are easy using static `Object` methods:
  - `_.assign(obj2, obj2) -> Object.assign(obj1, obj2)` or even `{ ...obj1, ...obj2 }` if you don't want to mutate.
  - `_.create -> Object.create`
  - `_.defaults(obj, def) -> obj = { ...def, ...obj }`
  - `_.entries(obj) -> Object.entries(obj)`
  - `_.findKey(obj, pred) -> Object.entries(obj).find(pred)?.[0]`
  - `_.invert -> Object.fromEntries(Object.entries(obj).map(([k, v]) => [v, k]))`
  - `_.keys(obj) -> Object.keys(obj)`
  - `_.mapKeys(obj, map) -> Object.fromEntries(Object.entries(obj).map(([k, v]) => [map(k), v]))`
  - `_.mapValues(obj, map) -> Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, map(v)]))`
  - `_.transform(obj, reducer, acc) -> Object.entries(obj).reduce(reducer, acc)`
  - `_.values(obj) -> Object.values(obj)`

Most useful string helpers are built-in, as well. Now, there still are a few categories that haven't been covered by the ES evolution. Lodash function module still includes very useful helpers like `once, memoize, debounce, throttle`. Lodash also supports 

You can also argue that lodash offers better performance by avoiding intermediate objects. This is a controversial claim, but the main thing here is that you are not likely to deal with object big enough for any performance difference to become noticeable. One actually _good_ argument in favor of lodash is that it offers a higher-level API that makes it clear what you're trying doing without getting lost in the implementation details.

Whatever reasons you have to cling onto lodash, I have not _one,_ but _five_ excellent libraries that 

### Alternative libraries

Of course, 

[remeda](https://github.com/remeda/remeda) and [rambda](https://github.com/selfrefactor/rambda) are two utility libraries heavily influenced by ramda. In the same family, we have [@tinkoff/utils](https://github.com/Tinkoff/utils.js) — 173 helpers, 1 import per helper. Conservative browser target.

[just](https://github.com/angus-c/just) is a family of 82 libraries that cover most of your needs, and are _extremely_ lightweight.

Finally, [@fxts/core](https://github.com/marpple/FxTS) contains 96 helpers in a tree-shakable package. Lazy evaluation support.

The libraries offer similar feature sets

- just is published as a set of separate libraries
- tinkoff requires you to import 

All the libraries are well-tested.

These libraries are, of course, [dwarfed](https://npmtrends.com/@fxts/core-vs-@tinkoff/utils-vs-just-debounce-it-vs-lodash-vs-rambda-vs-remeda) in comparison to lodash, but they are by no means obscure. Let me put things into perspective by comparing these to sell-known UI frameworks (as of 2023):

- rambda is the most popular of the bunch, and has roughly the same downloads as svelte, quite a popular framework.
- remeda and just (even though it's hard to measure given the separate packages) are [roughly on the order of alipine and stimulus,](https://npmtrends.com/alpinejs-vs-just-debounce-it-vs-remeda-vs-stimulus) solid production-grade choices.
- `@tinkoff/utils` and `@fxts/core` seem like outliers even it this league, at 100x fewer installs. I'm pretty confident about tinkoff utils, given that it powers one of Russia's largest banks. Fxts is the least mature library of the bunch (it's at `v0.13`), but still good to keep an eye on.

---

