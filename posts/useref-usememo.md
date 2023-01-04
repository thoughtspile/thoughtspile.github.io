---
title: How useRef turned out to be useMemo's father
date: 2021-04-05 18:59:25
tags:
    - react
    - programming
    - frontend
    - hooks
---


It's no secret that react's `useCallback` is just sugar on top of `useMemo` that saves the children from having to see an arrow chain. As <a href="https://reactjs.org/docs/hooks-reference.html" target="_blank">the docs</a> go:

```jsx
useCallback((e) => onChange(id, e.target.value), [onChange, id]);
// is equivalent to
useMemo(() => (e) => onChange(id, e.target.value), [onChange, id]);
```

![](/images/hook-vader.jpg)

> A less known, probably useless, but very fun, fact: you can actually pass something other than a function to `useCallback` and have it memoized.
>
> ```js
 const stableValue = useCallback({ please: 'dont do this' }, []);
 // yes-yes, stableValue is that object, as of react@17.0.2
```

As I got more into hooks, I've been surprised to realize how similar `useMemo` itself is to `useRef`. Think about it that way: `useRef` does a very simple thing — persists a value between render function calls and lets you update it as you wish. `useMemo` just provides some automation on top for updating this value when needed. Recreating `useMemo` is fairly straightforward:

```jsx
const memoRef = useRef();
const lastDeps = useRef(deps);
// some shallow array comparator, beside the point
if (!arrayEquals(deps, lastDeps.current)) {
    memoRef.current = factory();
    lastDeps.current = deps;
}
const memoized = memoRef.current;
// ... is equivalent to const memoized = useMemo(factory, deps);
```

As a special case, raw `useRef` is _almost_ the same as `useMemo` with no deps, save for actually building the initial value on every render and then throwing it away:

```jsx
const stableData = useRef({}).current; // same as useMemo(() => {}, []);
```

Treating `useRef` as a stripped-down `useMemo` can prove useful in some cases. If the built-in caching mechanism does not work for you, `useRef` is a perfect way to tweak it. Some motivational examples:

- Actually cache all the previous results using eg <a href="https://github.com/caiogondim/fast-memoize.js" target="_blank">fast-memoize.</a> `useMemo` appears to just cache the last result, which is a good default.
- Support true array dependencies with dynamic length: `useArrayMemo(() => hash(arrayValues), arrayValues)`
- Use an object instead of an array: `useObjectMemo(() => props, props)` gives you the same reference unless a prop has changed.
- More generally, allow any custom comparator for deps: `useCustomMemo(() => lib.sum(table1, table2), [table1, table2], (a, b) => a.equals(b))`

These may not be the most common use cases, but it's good to know that this is doable, and that `useRef` is there to help you in case you ever need it.

> On to another fun fact — you can make `useMemo` return a constant-reference `RefObject` box, equivalent to `useRef`. It's not clear why you would want that.
> ```js
useMemo(() => ({ current: initialValue }), [])
```

---

So, wrapping up:

1. `useCallback` is just tiny sugar on top of `useMemo`.
2. `useMemo` is just `useRef` with auto-update functionality.
3. You can build customized versions of `useMemo` with `useRef`.
4. You _can_ bend `useCallback` to be a `useMemo`, and you can get `useMemo` to be a `useRef`, but that doesn't mean you _should._

On the other hand, `useState` (and `useReducer`) is an entirely different cup of tea, since they can trigger a rerender on update. More on these guys in the next post!
