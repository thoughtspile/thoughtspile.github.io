---
title: Make useRef lazy — 4 ways
tags:
  - react
  - javascript
  - hooks
date: 2021-11-30
---


I love `useRef`, but it lacks the lazy initializer functionality found in other hooks (`useState` / `useReducer` / `useMemo`). `useRef({ x: 0, y: 0 })` creates an object `{ x: 0, y: 0 }` on every render, but only uses it when mounting — it subsequent renders it's thrown away. With `useState`, we can replace the initial _value_ with an _initializer_ that's only called on first render — `useState(() => ({ x: 0, y: 0 }))` (I've explored this and other `useState` features in my [older post](/2021/09/27/usestate-tricks/)). Creating functions is very cheap in modern JS runtimes, so we skip allocating memory and building the object for a slight performance boost (see [benchmark](https://jsbench.me/p3kwj6ojfs)). 

I'm not super excited about doing useless work, and `useRef` is your primary tool for [avoiding useless re-renders.](/2021/10/18/non-react-state/) In this post, I'll show you four ways to support lazy initializer in `useRef`:

1. Move initialization to `useEffect`
2. Sync lazy `useRef` initializer that works like `useState` initializer.
3. Lazy `useRef` on top of `useState` (almost zero code!)
4. A `useRef` that only computes the value when you read `.current`

![](/images/lazy-useref-sofa.jpg)

## Use cases

Any ref that involves an object can benefit from lazy initialization. I use such refs a lot for [tracking gestures:](/2021/10/18/non-react-state/)

```jsx
const touch = useRef({ x: 0, y: 0 });
const onTouchMove = e => {
  touch.current = {
    x: e.touches[0].clientX, 
    y: e.touches[0].clientY,
  };
};
```

A lazy initializer is useless for atomic values like `useRef(9)`, since those are cheap to create, too.

For a slightly different use case, sometimes we want a stateful object (often a Resize/IntersectionObserver) with a stable identity — `useMemo` [does not guarantee it.](https://reactjs.org/docs/hooks-reference.html#usememo) We don't really want to reassign `current`, so a `RefObject` API is not needed:

```js
// Would be nice
const observer = useStableMemo(() => new IntersectionObserver(cb), []);
// Why write observer.current if you never swap an observer?
const rootRef = useRef(e => observer.observe(e)).current;
```

For each technique, we'll see how good it is at supporting both use cases.

## The async way

The most intuitive way to lazy-initialize a ref is combining a value-less `useRef()` with a mount effect:

```js
const ref = useRef();
useEffect(() => {
  ref.current = initialValue;
}, []);
```

Nicely, init inside an effect does not ([normally](/2021/11/15/unintentional-layout-effect/)) block the paint, allowing you to paint a touch faster. However, this implementation is not always convenient, because the `.current` value is not accessible before the effect — in the first render phase, in DOM refs, `useLayoutEffect`, and even in some other `useEffect`s (inside child components and ones scheduled before the _init_ effect) — try it yourself in a [codepen](https://codepen.io/thoughtspile/pen/wvrvQjN?editors=0011). If the whole `useRef` + `useEffect` construction is written inline in a component, you at least see that the initialization is delayed. Wrapping it into a custom hook increases the chances of a misuse:

```js
const observer = useLazyRef(() => new IntersectionObserver(...));
// spot the bug
useLayoutEffect(() => {
  observer.current.observe(node);
}, []);
```

The logic relying on `.current` is awkwardly pushed into effects, complicating your code:

```jsx
const [width, setWidth] = useState(0);
const node = useRef();
const observer = useLazyRef(() => 
  new ResizeObserver(([e]) => setWidth(e.borderBoxSize.width)));
useEffect(() => {
  observer.current.observe(node.current)
}, []);
return <div ref={node} data-width={width} {...props} />
```

Replacing `useEffect` with `useLayoutEffect` does not help much — a bunch of places that can't access the `current` still exists (first render, DOM refs, child `useLayoutEffect`s), _and_ now the initialization blocks the paint. As we'll see now, better ways to initialize early exist.

The `useEffect` approach works OK if you only need `.current` _later_ — in other effects, timeouts or event handlers (and you're 100% sure those won't fire during the first paint). It's my least favorite approach, because the other ones work better and avoid the "pre-initialization gap".

## The DIY way

If we want the `.current` value to be available at all times, but without re-creation on every render (a lot like `useState` / `useMemo`), we can just build a custom hook over bare `useRef` ourselves (see [codepen](https://codepen.io/thoughtspile/pen/MWEWzMe?editors=0011)):

```js
// none is a special value used to detect an uninitialized ref
const none = {};
function useLazyRef(init) {
  // not initialized yet
  const ref = useRef(none);
  // if it's not initialized (1st render)
  if (ref.current === none) {
    // we initialize it
    ref.current = init();
  }
  // new we return the initialized ref
  return ref;
}
```

This implementation is a good default for custom `useLazyRef` hooks: it works _anywhere_ — inside render, in effects and layout effects, in listeners, with no chance of misuse, and is similar to the built-in `useState` and `useMemo`. To turn it into a readonly ref / stable memo, just return `ref.current` — it's already initialized before `useLazyRef` returns.

> Note that using `null` as the un-initialized value breaks if `init()` returns `null`, and setting `ref.current = null` triggers an accidental re-initialization on next render. `Symbol` works well and might be more convenient for debugging.

This is the most convenient approach for storing `observers`, because they're safe to use from DOM refs:

```jsx
const [width, setWidth] = useState(0);
const observer = useLazyRef(() => 
  new ResizeObserver(([e]) => setWidth(e.borderBoxSize.width))).current;
const nodeRef = useRef((e) => observer.observe(e)).current;
return <div ref={nodeRef} data-width={width} {...props} />
```

The only downside is that the initializer runs even if we never read the value. I'll show you how to avoid this, but first let's see how we can (and can't) build _this_ flavor of lazy `useRef` over other hooks.

## The resourceful way

If `useState` has the lazy initializer feature we want, why not just use it instead of writing custom code ([codepen](https://codepen.io/thoughtspile/pen/eYGYbYg?editors=0011))?

```js
const ref = useState(() => ({ current: init() }))[0];
```

We `useState` with a lazy initializer that mimics the shape of a RefObject, and throw away the update handle because we'll never use it — ref identity must be stable. For readonly ref / stable-memo we can skip the `{ current }` trick and just `useState(init)[0]`. Storing a mutable object in `useState` is not the most orthodox thing to do, but it works pretty well here. I imagine that at some point future react _might_ choose to rebuild the current `useState` by re-initializing and re-applying all the updates (e.g. for HMR), but I haven't heard of such plans, and this will break a lot of stuff.

As usual, anything doable with `useState` can also be done with `useReducer`, but it's slightly more complicated:

```js
useReducer(
  // any reducer works, it never runs anyways
  v => v, 
  // () => {} and () => 9 work just as well
  () => ({ current: init() }))[0];
// And here's the stable memo:
useReducer(v => v, init)[0];
```

The most obvious base hook, `useMemo`, doesn't work well. `useMemo(() => ({ current: init() }), [])` currently returns a stable object, but React docs [warn against relying](https://reactjs.org/docs/hooks-reference.html#usememo) on this, since a future React version might re-initialize the value when it feels like it. If you're OK with that, you didn't need `ref` in the first place.

`useImperativeHandle` is not recommended, too — it [has something to do with refs,](https://reactjs.org/docs/hooks-reference.html#useimperativehandle) but its [implemented](https://github.com/facebook/react/blob/82c8fa90be86fc0afcbff2dc39486579cff1ac9a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1777) to set the value in a layout effect, similar to the worst one of our `async` options. Also, it 

So, `useState` allows you to build a _lazy ref_ with almost zero code, at a minor risk of breaking in a future react version. Choosing between this and a DIY lazy ref is up to you, they work the same.

## The really lazy way

I'd argue that what we've discussed so far isn't really _lazy_ — sure, you avoid useless job on re-render, but you still eagerly compute the initial value on first render. What if we only computed the value on demand, when someone reads `.current`?

```js
const none = {};
function useJitRef(init) {
  const value = useRef(none);
  const ref = useLazyRef(() => ({
    get current() {
      if (value.current === none) {
        value.current = init();
      }
      return value.current;
    },
    set current(v) {
      value.current = v;
    }
  }));
  return ref;
}
```

Tricky! See [codepen](https://codepen.io/thoughtspile/pen/YzrzdyJ?editors=0011), and let me break it down for you:

- Wrap the bare ref with a get / set interceptor
- Reading `current` goes through the `get()`, computing the value on first read and returning the cached value later.
- Assigning `current` updates the value instantly and removes the need to initialize.
- The wrapper object is a `useLazyRef` itself to preserve the builtin `useRef` guarantee of stable identity and avoid extra object creation.

For readonly ref / stable memo, try the simpler _getter function_ approach [suggested in react docs:](https://reactjs.org/docs/hooks-faq.html#how-to-create-expensive-objects-lazily)

```js
const none = {};
function useMemoGet(init) {
  const value = useRef(none);
  return useCallback(() => {
    if (value.current === none) {
      value.current = init();
    }
    return value.current;
  }, []);
}
```

Is it worth the trouble? Maybe, maybe not. The code is more complicated than the eager `useLazyRef`. If the initializer is _really_ heavy, and you use the value conditionally, and you often end up not needing it, sure, it's a good fit. Honestly, I have yet to see a use case that fits these conditions.

This is a very interesting and flexible technique that supports many variations:

- Pre-compute the value, e.g. in `requestIdleCallback(() => ref.current)`
- Allow for lazy updates — don't set the explicit value, but provide a new way to compute it: `ref.current = () => el.clientWidth`
- Replace _updating_ with _invalidation_ — say, with `getWidth = useMemoGet(() => el.clientWidth)` you can mark the cached value as stale with `getWidth.invalidate()` on content change.

---

We've covered 4 good base techniques (`useState` is an alternative implementation of ) for creating lazy useRef. They all have different characteristics that make them useful for different problems:

- Initialize in `useEffect` — not recommended because it's easy to hit un-initialized `.current`.
- Sync custom-built `useRef` works well, but blocks first render. Good enough for most cases.
- Putting the value into `useState`'s initializer, but hiding the update handle. Least code, but a chance of breaking in future react versions.
- On-demand `useRef` that only computes the value when you read `.current` — complicated, but flexible and never computes values you don't use.

Hope you find this useful! If you want to learn more about react, check out my [other posts.](/)
