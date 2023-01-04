---
title: How to replace useState with useRef and be a winner
tags:
  - react
  - javascript
  - hooks
date: 2021-10-18 14:21:27
---


React state is the bread and butter of a react app — it's what makes your app dynamic. React state lives in `useState`, `useReducer` or in `this.state` of a class component, and changing it updates your app. But then there's a vast ocean of state not managed by React. This includes `ref.current`, object properties, and, really, anything other than react state.

React state is a safe default — if you put a dynamic value somewhere else, the component won't re-render. But stuffing values that don't _need_ to be managed by react into state is more sneaky. It rarely results in visible bugs, but makes your components more complex and slows them down.

In this post, we'll:

- Discuss the difference between react state and non-react state;
- See when state can be safely replaced with a ref (spoiler: you only _need_ state if your JSX depends on it, or to trigger `use*Effect`);
- Learn a few optimizations for performance-critical cases.

![](/images/states.png)

## What are we even talking about?

Let's first spend a minute reflecting on what's so special about react state, and what types of non-react state exist, and how they're so different, but still useful.

Describing react state is easy: it's a value stored in `useState` hook (or `useReducer`, since [they are the same](/2021/09/27/usestate-tricks/)) or in `this.state` of a class component. Updating react state makes your component re-render. In fact, updating react state is the _only_ thing that makes react re-render. React veterans recall `forceUpdate`, but it can be [trivially emulated with a setState](https://stackoverflow.com/a/53215514). `ReactDOM.render` makes your app _render,_ not _re_-render. So, react state is what makes react tick.

Now, let's see where else in our app a state can live. "Anywhere else" is correct, but too vague — let's make a list of common locations:

1. `useRef().current`.
2. Class properties of class components, fashionable or not.
3. Actually, every property of every object ever.
4. Yes, that includes state managers. Their state only turns into react state after a couple of magic tricks.
5. DOM state — input values, focus, scrolls, any DOM tree elements and attributes not managed by React. Making them _controlled_ does not literally turn them into react state, it's just another trick.
6. Values of variables. You may have never thought of these as "state", but hey — that's a value lying in memory that closures can read, so it qualifies.

This list could go on: other stateful browser APIs (think pending timeouts), back-end state, the photons in the transatlantic cables carrying our API data, your user's neural signals, and all his lifetime experience, and that tree in the forest that fell while no one was watching, all came together just for the user to click the button you're building now. Does free will exist? Are we mere grains of sand carried by the flow of creation? Oh no, Vladimir, you've done it again, let's get back on track, shall we? There are more pressing and practical matters we need to discuss today.

## When to use react state

React depends on state to make your app dynamic. That is the core functionality of a front-end framework, so you'd expect an infinite variety of use cases to exist. But in fact, there are only two situations when you _must_ use react state, and they are easy to spot.

Every dynamic value that affects your component's DOM is react state. Fair enough, the UI should stay up-to-date. Quick example, no revelations here:

```jsx
function Incrementer() {
  const [value, setValue] = useState(0);
  return (
    <button onClick={() => setValue(value + 1)}>
      Clicked {value} times
    </button>
  );
}
```

But values that have no effect on the vDOM can still belong in react state. Why? To trigger an effect:

```jsx
function TitleRandomizer() {
  const [title, setTitle] = useState('');
  useEffect(() => {
    document.title = title;
  }, [title]);
  return (
    <button onClick={() => setTitle('' + Math.random())}>
      randomize page title
    </button>
  );
}
```

This is not exclusive to hooks — `componentDidUpdate` is no different, since it's only called when a component, you know, _did update:_

```jsx
componentDidUpdate() {
  document.title = this.state.title;
}
```

Believe it or not, that's it: use react state for values that (a) are used in the JSX _or_ (b) trigger side-effects via `use*Effect` or in lifecycle hooks. In all other cases, you can safely store them anywhere you want.

## When not to use React state

Is there anything wrong with react state? You'd much prefer your app to update, not to stay jammed in a stale state. It's a fine feature, but _not_ using react state has some hard (and some soft) advantages.

First, non-react state is easier to work with. Updates to non-react state are synchronous — no need to put stuff that reads an updated value into effects or that nasty `this.setState` callback. You also get to utilize mutable data containers and assign them directly without [immer](https://github.com/immerjs/immer) or [mobx](https://mobx.js.org/) — I know you've secretly missed it.

```jsx
// We've come to accept this
setChecked({ ...checked, [value]: true });
// But isn't this just nicer?
checked[value] = true;
```

Secondly, updating a non-react state doesn't trigger a re-render. You can see it as a footgun, or you can use it to your advantage. The lack of rendering enables very powerful performance optimizations — see hard rule of performance #1/1: doing nothing is _not slower_ than doing something. Also, since refs are constant-reference mutable objects, you don't have to recreate callbacks that rely on them, and can thus skip re-rendering memo-children:

```jsx
const onCheck = useCallback((value) => {
  // re-render, including children
  setChecked({ ...checked, [value]: true });
}, [checked]);
const onCheckRef = useRef((value) => {
  // relax, react, nothing happened
  checked[value] = true;
}).current;
```

Not using react state helps avoid a problem I call _render thrashing_ — a react equivalent of [layout thrashing.](https://www.afasterweb.com/2015/10/05/how-to-thrash-your-layout/) That's when a state change triggers an effect that changes more state, and react must keep re-rendering until the state stabilizes. If timed correctly, ref updates are very effective at avoiding this pitfall.

Finally, react state carries more semantics, and overusing it makes your app seem more complex. State is a big deal in react. Touching state has consequences — it triggers DOM changes and funny side-effects. When changing a non-state, you just change it, and maybe later someone can read it back. Not so scary!

One _caveat_ pointed out by [Lenz Weber:](https://twitter.com/phry) accessing `ref.current` in the render phase is not concurrent-mode-safe, and [may cause a warning](https://github.com/facebook/react/pull/18545) in a future react version. Setting state while rendering seems to work. At any rate, firing side-effects from a render function is not healthy.

Now, let's move on to some concrete examples where replacing state with a ref is useful.

### Values you only need in callbacks

You don't need react state if you only use it in callbacks — event handlers or effects. To demonstrate this, let's build a simple swipe detector. The user puts a finger on the screen and moves it left or right. Sticking to react state, we end up with:

```jsx
function Swiper({ prev, next, children }) {
  const [startX, setStartX] = useState();
  const detectSwipe = e => {
    e.touches[0].clientX > startX ? prev() : next();
  };
  return <div
    onTouchStart={e => setStartX(e.touches[0].clientX)}
    onTouchEnd={detectSwipe}
  >{children}</div>;
}
```

`startX` does not affect the DOM or fire any effects, we only store it to read later in a `touchend`. Still, you get a useless render on `touchstart`. Let's try again with a ref:

```jsx
function Swiper({ prev, next, children }) {
  const startX = useRef();
  const detectSwipe = e => {
    e.touches[0].clientX > startX.current ? prev() : next();
  };
  return <div
    onTouchStart={e => startX.current = e.touches[0].clientX}
    onTouchEnd={detectSwipe}
  >{children}</div>;
}
```

Voila, Swiper now doesn't have to re-render on `touchstart`. Additionally, `detectSwipe` now doesn't depend on the changing `startX` reference, so you can `useCallback(..., [])` on it. Awesome!

By the way, the tradition of storing DOM nodes in a ref is a special case of this rule — it works because you only access the node in callbacks.

### Buffering state updates

OK, one render is _nothing_ for react. Let's up the stakes by bringing in a whole rerendering barrage. Now the user can move the `Swiper` content around with the power of his finger:

```jsx
function Swiper({ children }) {
  const startX = useRef(null);
  const [offset, setOffset] = useState(0);
  const onStart = (e) => {
    startX.current = e.touches[0].clientX;
  };
  const trackMove = (e) => {
    setOffset(e.touches[0].clientX - startX.current);
  };
  return <div
    onTouchStart={onStart}
    onTouchMove={trackMove}
  >
    <div style={{ transform: `translate3d(${offset}px,0,0)` }}>
      {children}
    </div>
  </div>;
}
```

It works, but note how `touchMove` updates state and makes the component re-render. `touchMove` event is famous for firing _a lot_ — I ended up with [4–5 renders per frame.](
https://codesandbox.io/s/objective-lederberg-zjft4) The user only sees the result of the last render before paint, the other 4 are wasted. `requestAnimationFrame` is a perfect fit for this case — we remember the swipe position in a ref, but only update the state once per frame:

```jsx
const pendingFlush = useRef();
const trackMove = (e) => {
  if (startX.current != null) {
    cancelAnimationFrame(pendingFlush.current);
    pendingFlush.current = requestAnimationFrame(() => {
      setOffset(e.clientX - startX.current);
    });
  }
};
```

Here's an alternate take. Instead of canceling the pending RAF, we can let them all fire, but set state to the same value — [only one will cause a re-render:](/2021/09/27/usestate-tricks/)

```jsx
const pendingOffset = useRef();
const trackMove = (e) => {
  if (startX.current != null) {
    pendingOffset.current = e.clientX - startX.current;
    requestAnimationFrame(() => {
      setOffset(pendingOffset.current);
    });
  }
};
```

We've just implemented a custom update batching mechanism by making state and ref work together. The mutable ref acts as a _staging area_ for pending state updates. Just like the last time, `trackMove` only depends on stable refs, and can be turned into a const-reference callback.

### State that you want to manage yourself

When the user moves his finger, we let react determine the current offset and update the `style` accordingly. React may be fast, but it doesn't know that `trackMove` just changes the transform, and has to do a lot of guessing — call your render, generate the vDOM, diff it, and then, a-ha, it seems like we just have to update a transform. But _you_ know what you're up to, and can save React all that trouble by just doing it yourself:

```jsx
function Swiper({ children }) {
  const startX = useRef(null);
  const transformEl = useRef();
  const onStart = (e) => {
    startX.current = e.touches[0].clientX;
  };
  const trackMove = (e) => {
    const offset = e.touches[0].clientX - startX.current;
    transformEl.current.style.transform = `translate3d(${offset}px,0,0)`;
  };
  return <div
    onTouchStart={onStart}
    onTouchMove={trackMove}
  >
    <div ref={transformEl}>
      {children}
    </div>
  </div>;
}
```

Voila, 0 renders! Fair warning — it's very easy to trick yourself here, especially if several things can affect the DOM. Reserve this technique for frequent low-level stuff like animations and gestures — it can make a huge difference.

### Derived state

If a value always updates _together_ with a react state item, we can piggyback on that re-render and update something else that is not react state along the way. This can be very clean — remember how I said _any_ variable holds a state?

```jsx
const [value, setValue] = useState(0);
const isValid = value >= 0 && value < 100;
```

This can be trickier and involve a ref, but still straightforward on the outside, as `useMemo` — yes, it [does use a ref](/2021/04/05/useref-usememo/) deep inside:

```jsx
const [search, setSearch] = useState('');
const matches = useMemo(() => {
  return options.filter(op => op.startsWith(search));
}, [options, search]);
```

In both cases, we're using non-react state, carefully synchronizing its updates with the master state. Much better than cascading state updates:

```jsx
// un-example
const [search, setSearch] = useState('');
const [matches, setMatches] = useState([]);
useEffect(() => {
  // now we re-render twice per search change
  setMatches(options.filter(op => op.startsWith(search)));
}, [options, search]);
```

---

Wow, it's been a long post. Now we need a multi-part recap:

- State in a react app can be either a react state (`this.state`, `useState`, `useReducer`) or non-react state (`ref.current`, object properties, variable values, or anything else).
- Only updates to react state make react re-render, so you _must_ used it when the vDOM depends on it, or to trigger a `use*Effect`.

Not using state has some advantages:

- Fewer renders
- More stable callbacks
- No cascading state updates aka _render thrashing_
- Synchronously mutating data is so nice
- Overusing state makes a component seem complex

Here are 4 powerful optimizations relying on non-react state:

- If a value is only used in callbacks – make it a ref (includes DOM refs).
- A ref can be a buffer for pending state updates.
- Use refs if you feel you can update the DOM yourself without involving react.
- Derived state also relies on refs, carefully updated on core state changes.

As a rule of thumb, refs are fine as long as you don't use their current value in render.

State vs non-state is a very powerful concept that I'll revisit in my future posts. As a homework, try thinking about how React's only job is actually synchronizing its state to the external DOM state. Or that state-of-the-univerese thing I talked about earlier. See you soon!
