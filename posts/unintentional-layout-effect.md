---
title: useEffect sometimes fires before paint
date: 2021-11-15
tags:
  - react
  - hooks
  - javascript
  - frontend
---


`useEffect` should run after paint to prevent blocking the update. But did you know it's not really _guaranteed_ to fire after paint? Updating state in `useLayoutEffect` makes every `useEffect` from the same render run _before_ paint, effectively turning them into layout effects. Confusing? Let me explain.

In a normal flow, react updates go like this:

1. React stuff: render virtual DOM, schedule effects, update real DOM
2. Call `useLayoutEffect`
3. React releases control, browser paints the new DOM
4. Call `useEffect`

[React docs](https://reactjs.org/docs/hooks-reference.html#useeffect) don't say when, exactly, useEffect fires — it happens, quote, __after layout and paint, during a deferred event.__ I always assumed it was a `setTimeout(effect, 3)`, but it [appears to use](https://stackoverflow.com/a/56727837) a `MessageChannel` trick, which is neat.

There is, however, a more interesting passage in the docs:

> Although useEffect is deferred until after the browser has painted, it’s guaranteed to fire before any new renders. React will always flush a previous render’s effects before starting a new update.

This is a good guarantee — you can be sure no updates are missed. But it also implies that sometimes the effect fires before paint. If _a)_ effects are flushed before a new update starts, and _b)_ an update can start _before_ paint, e.g. when triggered from `useLayoutEffect`, _then_ the effect must be flushed _before_ that update, which is _before_ paint. Here's a timeline:

![](/images/forced-le-flush-chart.png)

1. React update 1: render virtual DOM, schedule effects, update DOM
2. Call `useLayoutEffect`
3. __Update state,__ schedule re-render
4. __Call `useEffect`__
5. React update 2
6. Call `useLayoutEffect` from update 2
7. React releases control, browser __paints__ the new DOM
8. Call `useEffect` from update 2

This is not a very rare situation — you can't really update state in `useEffect`, because updating state updates the DOM, and doing so after paint leaves the user with one stale frame, [resulting in noticeable flickering.](https://blog.logrocket.com/useeffect-vs-uselayouteffect/)

For example, let's build a responsive input (like a fake [CSS container query](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries)) that only renders the clear button if the input is wider than `300px`. We need real DOM to measure the input, so we need some effect. We also don't want the icon to appear / disappear after one frame, so the initial measurement goes into `useLayoutEffect`:

```jsx
const ResponsiveInput = ({ onClear, ...props }) => {
  const el = useRef();
  const [w, setW] = useState(0);
  const measure = () => setW(el.current.offsetWidth);
  useLayoutEffect(() => measure(), []);
  useEffect(() => {
    // don't take this too seriously, say it's a ResizeObserver
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  return (
    <label>
      <input {...props} ref={el} />
      {w > 200 && <button onClick={onClear}>clear</button>}
    </label>
  );
};
```

We've tried to delay `addEventListener` until after paint with `useEffect`, but the state update in `useLayoutEffect` forces it to happen before paint [(see sandbox):](https://codesandbox.io/s/infallible-wildflower-127lv?file=/src/App.js:294-408)

![](/images/le-flush-paint.png)

`useLayoutEffect` is not the only place where updating forces an early effect flush — host refs (`<div ref={HERE}>`), `requestAnimationFrame` loops, and microtasks scheduled from uLE trigger the same behavior.

Fine, this is not the end of the world — under some circumstances, your render flow is less optimal than it could be, who cares. Still, it's useful to know the limitations of your tool. Here are 4 practical lessons to learn:

### Don't rely on useEffect to fire after update

Even if you know the catch, it's very hard to make sure some `useEffect` is not affected by `useLayoutEffect` state update:

1. My component doesn't `useLayoutEffect`. But are you sure none of the custom hooks (e.g. `usePopper`) do that?
1. My component only uses built-in React hooks. But a uLE state update up the tree can leak through `useContext` or a parent re-render.
3. My component only has `useEffect`, and a `memo()`. But effects from an update [are flushed globally](https://github.com/facebook/react/blob/4ff5f5719b348d9d8db14aaa49a48532defb4ab7/packages/react-reconciler/src/ReactFiberWorkLoop.new.js#L769), so a pre-paint update in other components still flushes child effects.

With a lot of discipline you probably can have a codebase with _no_ state updates in `useLayoutEffect`, but that's superhuman. The best advice is not to rely on `useEffect` to fire after paint, just like `useMemo` does not guarantee 100% stable reference. If you _want_ the user to see something painted for one frame, `useEffect` is not the way to do it — try double `requestAnimationFrame` or do the postMessage trick yourself.

Conversely, suppose you don't listen to the good advice from React team and update DOM in `useEffect`. You test it, and, _aha!_, no flickering. Bad news — maybe it's the result of a state update before paint. Move some code around, and it _will_ flicker.

### Don't waste your time splitting layout effects

Following `useEffect` vs `useLayoutEffect` guidelines to the letter, we could split one logical side-effect into a layout effect to update the DOM, and a "delayed" effect, like we've done in our `ResponsiveInput` example:

```jsx
// DOM update = layout effect
useLayoutEffect(() => setWidth(el.current.offsetWidth), []);
// subscription = lazy logic
useEffect(() => {
  window.addEventListener('resize', measure);
  return () => window.removeEventListener('resize', measure);
}, []);
```

However, as we now know, this does nothing — both effects are flushed before render. Besides, the separation is _sloppy_ — if we pretend `useEffect` does fire after paint, are you 100% sure the element won't resize between the effects? I'm not. Leaving all size-tracking logic in a single `layoutEffect` here is safer, cleaner, has the same amount of pre-paint work, and gives React one less effect to manage — pure win:

```js
useLayoutEffect(() => {
  setWidth(el.current.offsetWidth);
  window.addEventListener('resize', measure);
  return () => window.removeEventListener('resize', measure);
}, []);
```

### Don't update state in useLayoutEffect

Good advice, but easier said than done — `useEffect` is a worse place to update state, because flickering is poor UX, and UX is more important than performance. Updating state during render looks dangerous. 

Sometimes state can be safely replaced with useRef. Updating a ref doen't trigger an update, and the effect can run as intended. I happen to have [a post exploring some of these cases.](https://thoughtspile.github.io/2021/10/18/non-react-state/)

If you can, try to come up with a [state model that doesn't rely on effects,](https://thoughtspile.github.io/2021/09/21/useeffect-derived-state/) but I don't know how to invent "good" state models on command.

### Bypass state update

If you find particular `useLayoutEffect` causing trouble, consider bypassing state update and mutating DOM directly. That way, react doesn't schedule an update, and needn't flush effects eagerly. We could try:

```jsx
const clearRef = useRef();
const measure = () => {
  // No worries react, I'll handle it:
  clearRef.current.display = el.current.offsetWidth > 200 ? null : none;
};
useLayoutEffect(() => measure(), []);
useEffect(() => {
  window.addEventListener("resize", measure);
  return () => window.removeEventListener("resize", measure);
}, []);
return (
  <label>
    <input {...props} ref={el} />
    <button ref={clearRef} onClick={onClear}>clear</button>
  </label>
);
```

I've explored this technique in my [older post on avoiding `useState`](https://thoughtspile.github.io/2021/10/18/non-react-state/), and we just got one more reason to skip react updates. Still, manually managing DOM updates is complicated and error-prone, so reserve this trick for performance-critical situations — very hot components or super-heavy useEffects.

---

Today we've discovered that `useEffect` sometimes executes before paint. A frequent cause is updating state in `useLayoutEffect` — it requests a re-render _before_ paint, and the effect must run before that re-render. This also happens when updating state from RAFs or microtasks. What this means for us:

1. Updating state in `useLayoutEffect` is not good for app performance. Try not to do that, but sometimes there is no good alternative.
1. Don't rely on `useEffect` to fire after paint.
1. Updating DOM from `useEffect` _will_ cause a visible flicker — maybe you don't see it because of a layout effect updating state.
1. Extracting a part of `useLayoutEffect` into `useEffect` for _performance_ makes no sense if you set state in the layout effect part.
1. One more reason to mutate the DOM from uLE manually in performance-critical cases.
