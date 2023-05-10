---
title: 'Svelte stores: the curious parts'
tags:
    - svelte
    - programming
    - javascript
date: 2023-04-22
---

We've already [learnt a lot about svelte's reactivity system](https://blog.thoughtspile.tech/2023/04/22/svelte-state/) — the primary way to work with state in svelte components. But not all state belongs in components — sometimes we want app-global state (think state manager), sometimes we just want to reuse logic between components. React has [hooks,](https://react.dev/reference/react) Vue has [composables](https://vuejs.org/guide/reusability/composables.html). For svelte, the problem is even harder — reactive state _only_ works inside component files, so the rest is handled by a completely separate mechanism — stores. The [tutorial](https://svelte.dev/tutorial/writable-stores) does a decent job of covering the common use cases, but I still had questions:

1. What's the relationship between the stores? Are they built on some common base?
2. Is it safe to use `{ set } = store` as a free function?
3. How does `get(store)` receive the current value if it's not exposed on the object?
4. Does `set()` trigger subscribers when setting the current value?
5. What's the order of subscriber calls if you `set()` inside a subscriber?
6. Does `derived` listen to the base stores when it's not observed?
7. Will changing two `dervied` dependencies trigger one or two derived computations?
8. Why does `subscribe()` have a second argument?
9. What is `$store` sytax compiled to?

In this article, I explore all these questions (and find a few svelte bugs in the process).

![](/images/svlete-stores.png?invert)

## writable is the mother store

Svelte has 3 built-in store types: `writable`, `readable`, and `derived`. However, they are neatly implemented in terms of one another, [taking only 236 lines,](
https://github.com/sveltejs/svelte/blob/master/src/runtime/store/index.ts) over half of which is TS types and comments.

The implementation of `readable` is remarkably simple — it creates a writable, and only returns its subscribe method. Let me show it [in its entirety:](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L60)

```js
const readable = (value, start) => ({
  subscribe: writable(value, start).subscribe
});
```

Moreover, `derived` is just [a special way](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L173) of constructing `readable`:

```js
export function derived(stores, fn, initial_value) {
    // ...some normalization
	return readable(initial_value, /* some complex code */);
}
```

While we're at it, note that `update` method of a writable store is a [very thin wrapper](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L94) over `set`: `fn => set(fn(value))`. 

All in all:

- `writable` is the OG store,
- `readable` just removes `set` & `update` methods from a writable,
- `derived` is just a predefined `readable` setup,
- `update` is just a wrapper over `set`.

This greatly simplifies our analysis — we can just investigate `writable` arguments, `subscribe`, and `set` — and our findings also hold for other store types. Well done, svelte!

## Store methods don't rely on `this`

Writable (and, by extension, readable and derived) is implemented with objects and closures, and does not rely on `this`, so you can safely pass free methods around without dancing with `bind`:

```js
const { subscribe, set } = writable(false);
const toggle = { subscribe, activate: () => set(true) };
```

However, arbitrary custom stores are not guaranteed to have this trait, so it's best to stay safe working with an unknown store-shaped argument — like [svelte itself](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L226) does with `readonly`:

```js
function readonly(store) {
	return {
		subscribe: store.subscribe.bind(store),
	};
}
```

## Subscriber is invoked immediately

As svelte stores implement observable value pattern, you'd expect them to have a way to access current value via `store.get()` or `store.value` — but it's not there! Instead, you use the special `get()` helper function:

```js
import { get } from 'svelte/store'
const value = get(store);
```

But, if the store does not expose a value, how can `get(store)` synchronously access it? Normally, the subscribers are only called on change, which can occur whenever. Well, svelte `subscribe` is not your average subscribe — calling  `subscribe(fn)` not only starts listening to changes, but also synchronously calls `fn` with the current value. `get` subscribes to the store, extracts the value from this immediate invocation, and immediately unsubscribes — [like this:](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/internal/utils.ts#L77)

```js
let value;
const unsub = store.subscribe(v => value = v);
unsub();
```

The official svelte tutorial [section on custom stores](https://svelte.dev/tutorial/custom-stores) says: _as long as an object correctly implements the subscribe method, it's a store._ This might bait you into writing "custom stores" with `subscribe` method, not based off of `writable`. The trick word here is _correctly implements_ — even based on the tricky `subscribe` self-invocation it's not an easy feat, so please stick to manipulations with readable / writable / derived.

## set() is pure for primitives

`writable` stores are pure in the same sense as svelte state — [notifications are skipped]() when state is primitive, and the next value is equal to the current one:

```js
const s = writable(9);
// logs 9 because immediate self-invocation
s.subscribe(console.log);
// does not log
s.set(9);
```

Object state [disables this optimization](https://svelte.dev/repl/eb1a787c9bce4ae8b88f85934d7ec37d?version=3.59.1) — you can pass a shallow equal object, or the same (by reference) object, the subscribers will be called in any case:

```js
const s = writable({ value: 9 });
s.subscribe(console.log);
// each one logs
s.update(s => s);
s.set(get(s));
s.set({ value: 9 });
```

On the bright side, you can mutate the state in update, and it works:

```js
s.update(s => {
    s.value += 1;
    return s
});
```

## Subscriber consistency

Normally, `store.set(value)` synchronously calls all subscribers with `value`. However, a naive implementation will shoot you in the foot when updating a store from within a subscriber (if you think it's a wild corner case — it's not, it's how [derived stores work](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L187)):

```js
let currentValue = null;
const store = naiveWritable(1);
store.subscribe(v => {
    // let's try to avoid 0
    if (v === 0) store.set(1);
})
store.subscribe(v => currentValue = v);
```

If we now call `set(0)`, we intuitively expect both the store's internal value and currentValue to be `1` after all callbacks settle. But in practice it can fail:

1. Store value becomes 0;
2. First subscriber sees 0, calls `set(1)`, then:
    1. Store value becomes 1;
    2. `set(1)` synchronously invokes all subscribers with 1;
    3. First subscriber sees 1, does nothing;
    4. Second subscriber is called with 1, sets `currentValue` to 1;
    5. First subscriber run for 0 is completed, continuing with the initial updates triggered by `set(0)`
9. Second subscriber is called with 0, setting `currentValue` to 0;
9. Bang, inconsistent state!

This is very dangerous territory — you're bound to either skip some values, get out-of-order updates, or have subscribers called with different values. Rich Harris has [taken a lot of effort](https://github.com/sveltejs/svelte/commit/a2ff93cb721b786f34e467b9bddfbf6eebcfde43) to provide the following guarantees, regardless of where you `set` the value:

1. Every subscriber always runs for every `set()` call (corrected for primitive purity).
2. Subscribers for one `set()` run, uninterrupted, after one another (in insertion order, but I wouldn't rely on this too much).
3. Subscribers are invoked _globally_ (across all svelte stores) in the same order as `set` calls, even when set calls are nested (called from within a subscriber).
4. All subscribers are called synchronously within the outermost `set` call (the one outside any subscriber).

So, in our example, the [actual callback order is:](https://svelte.dev/repl/71f93e80c07c46f896a0ee44260b5ff1?version=3.59.1)

1. subscriber 1 sees 0, calls `set(1)`
2. subscribers calls with `1` are enqueued
3. subscriber 2 sets `currentValue = 0`
4. subscriber 1 runs with 1, does nothing
5. subscriber 2 sets `currentValue = 1`

Since the callback queue is global, this holds even when updating store B from a subscriber to store A. One more reason to stick with svelte built-in stores instead of rolling your own.

## Derived is lazy

`derived` looks simple on the surface — I thought it just `subscribe`s to all the stores passed, and keeps an up-to-date result of the mapper function. In reality, it's smarter than that — [subscription and unsubscription happens in the start / stop handler,](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L173) which yields some nice properties:

1. Subscriptions to base stores are automatically removed once you stop listening to the derived store, no leaks.
2. Derived value and subscriptions are reused no matter how many times you subscribe to a derived store.
2. When nobody is actively listening to a derived store, the mapper does not run.
3. The value is automatically updated when someone first subscribes to the derived store (again, courtesy of subscribe self-invocation).

Very, very tastefully done.

## Derived is not transactional

While lazy, `derived` is _not_ transactional, and _not_ batched — synchronously changing 2 dependencies will trigger 2 derivations, and 2 subscriber calls — one after the first update, and one after the second one.

In this [code sample,](https://svelte.dev/repl/5ad19198c21642678e70a283f8bbdfef?version=3.58.0) we'd expect `left + right` to always be 200 (we synchronously move 10 from left to right), there's a glimpse of `190` (remember, the subscribers are synchronously called during `set`):

```js
const left = writable(100);
const right = writable(100);
const total = derived([left, right], ([x, y]) => {
    console.log('derive', x, y);
    return x + y;
});
total.subscribe(t => console.log('total', t));

const update = () => {
    // try to preserve total = 200
    left.update(l => l - 10);
    // ^^ derives, and logs "total 190"
    right.update(r => r + 10);
    // ^^ derives, and logs "total 200"
};
```

This isn't a deal breaker, svelte won't render the intermediate state, but it's something to keep in mind, or you [get hurt](https://svelte.dev/repl/73b0d8843045485897226cabf8efc682?version=3.58.0):

```js
const obj = writable({ me: { total: 0 } });
const key = writable('me');
const value = derived([obj, key], ([obj, key]) => obj[key].total);

// throws, because { me: ... } has no 'order' field
key.set('order');
obj.set({ order: { total: 100 } });
```

## The mysteryous subscriber-invalidator

Looking at `subscribe()` types, you may've noticed the [mysterious second argument — `invalidate` callback.](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L98) Unlike the subscriber, it's not queued, and is always called synchronously during `set()`. The only place I've seen an invalidator used in svelte codebase is [inside `derived`](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L202) — and, TBH, I don't understand its purpose. I expected it to stabilize derived chains, but it's [not working.](https://svelte.dev/repl/a7607d2cf8644da7aa4de1d1d2804205?version=3.59.1) Also, the [TS types are wrong](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L13) — the value is [never passed](https://github.com/sveltejs/svelte/blob/64b8c8b33c52cdb1ae9ee8b0148809237c5cb997/src/runtime/store/index.ts#L81) to invalidator as an argument. Verdict: avoid.

## $-dereference internals

As you probably know, svelte components have a special syntax sugar for accessing stores — just prefix the store name with a `$`, and you can read and even assign it like a regular reactive variable — very convenient:

```jsx
import { writable } from 'svelte/store';
const value = writable(0);
const add = () => $value += 1;

<button on:click={add}>
    {$value}
</button>
```

I always thought that `$value` is compiled to `get`, `$value = v` to `value.set(v)`, and so on, with a subscriber triggering a re-render in some smart way, but it's not the case. Instead, `$value` becomes a regular svelte reactive variable, synchronized to the store, and the rest is handled by the standard svelte update mechanism. Here's [the compilation result:](https://svelte.dev/repl/73b0d8843045485897226cabf8efc682?version=3.59.1)

```js
// the materialized $-variable
let $value;
// the store
const value = writable(0);

// auto-subscription
const unsub = value.subscribe(value, value => {
    $$invalidate(0, $value = value)
});
onDestroy(unsub);

const add = () => {
    // assign to variable
    $value += 1;
    // update store
    value.set($value);
};
```

In plain English:

1. `$store` is a real actual svelte reactive variable.
2. `store.subscribe` updates the variable and triggers re-render.
3. The unsubscriber is stored and called `onDestroy`.
4. AFAIK, `store.update` is never used by svelte.
5. Assignments to `$store` simultaneously mutate `$store` variable _without_ invalidating and triggering re-render _and_ call `store.set`, which in turn enqueues the update via `$$invalidate`

The last point puts us in a double-source-of-truth situation: the current store value lives both in the `$store` reactive variable, and inside store itself. I expected this to cause some havok in an edge case, and so it does — if you patch `store.set` method to skip _some_ updates, the $-variable updates before your custom `set` runs, and the two values [go out of sync](https://svelte.dev/repl/50b2e2bb1a224a44ad51540e90978867?version=3.59.1) as of svelte@3.59.1:

```jsx
const value = {
    ...writable(0),
    // prevent updates
    set: () => {}
};
const add = () => $value += 1;
let rerender = {};
$: total = $value + (rerender ? 0 : 1);

{total}
<button on:click={add}>increment</button>
<button on:click={() => rerender = {}}>
    rerender
</button>
```

---

To summarize:

1. Both `readable` and `derived` are built on top of `writable` — readable only picks `subscribe` method, derived is a readable with a smart start / stop notifier.
2. Built-in stores don't rely on `this`, so you can safely use their methods as free functions.
3. Calling `subscribe(fn)` immediately invokes `fn` with the current value — used in `get(store)` to get the current value.
4. Calling `set()` with the current value of the store will skip notifying subscribers if the value is primitive. set() on object state always notifies, even if the object is same, by reference, as the current state.
5. The subscribers for a single `set()` run after one another. If a subscriber calls `set`, this update will be processed once the first `set()` is fully flushed.
6. `derived` only subscribes to the base stores and maps the value when someone's actively listening to it.
7. When synchronously changing two dependencies of `derived`, the mapper _will_ be called after the first change. There's no way to batch these updates.
8. `subscribe()` has a second argument — a callback that's called synchronously during `set()`. I can't imagine a use case for it.
9. `$store` syntax generates a regular svelte reactive variable called `$store`, and synchronizes it with the store in a subscriber.

If you learn one thing from this article — svelte stores are thoughtfully done and help you with quite a few corner-cases. Please avoid excessive trickery, and build on top of the svelte primitives. In the next part of my svelte series, I'll show you some neat tricks with stores — [stay tuned on twitter!](https://twitter.com/thoughtspile)