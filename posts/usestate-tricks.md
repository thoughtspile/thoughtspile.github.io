---
title: 7 things you may not know about useState
date: 2021-09-27
tags:
    - react
    - programming
    - frontend
    - hooks
---


Doing code reviews for our hook-based project, I often see fellow developers not aware of some awesome features (and nasty pitfalls) `useState` offers. Since it's one of my favourite hooks, I decided to help spread a word. Don't expect any huge revelations, but here're the 7 facts about `useState` that are essential for anyone working with hooks.

## Update handle has constant reference

To get the obvious out of the way: the update handle (second array item) is the same function on every render. You don't need to include it in array dependencies, no matter what [eslint-plugin-react-hooks](https://reactjs.org/docs/hooks-rules.html#eslint-plugin) has to say about this:

```js
const [count, setCount] = useState(0);
const onChange = useCallback((e) => {
    // setCount never changes, onChange doesn't have to either
    setCount(Number(e.target.value));
}, []);
```

## Setting state to the same value does nothing

`useState` is pure by default. Calling the update handle with a value that's equal (by reference) to the current value does nothing — no DOM updates, no wasted renders, nothing. Doing this yourself is useless:

```js
const [isOpen, setOpen] = useState(props.initOpen);
const onClick = () => {
    // useState already does this for us
    if (!isOpen) {
        setOpen(true);
    }
};
```

This doesn't work with shallow-equal objects, though:

```js
const [{ isOpen }, setState] = useState({ isOpen: true });
const onClick = () => {
    // always triggers an update, since object reference is new
    setState({ isOpen: false });
};
```

## State update handle returns undefined

This means setState can be returned from effect arrows without triggering _Warning: An effect function must not return anything besides a function, which is used for clean-up._ These code snippets work the same:

```js
useLayoutEffect(() => {
    setOpen(true);
}, []);
useLayoutEffect(() => setOpen(true), []);
```

## useState _is_ useReducer

In fact, `useState` is implemented in React code like a `useReducer`, just with a pre-defined reducer, at least as of 17.0 — ooh yes I actually did check [react source](https://github.com/facebook/react/blob/82c8fa90be86fc0afcbff2dc39486579cff1ac9a/packages/react-reconciler/src/ReactFiberHooks.new.js#L1464). If anyone claims `useReducer` has a hard technical advantage over `useState` (reference identity, transaction safety, no-op updates, etc) — call him a liar.

## You can initialize state with a callback

If creating a new state-initializer object on every render just to throw away is concerning to you, feel free to use the initializer function:

```js
const [style, setStyle] = useState(() => ({
    transform: props.isOpen ? null : 'translateX(-100%)',
    opacity: 0
}));
```

You can access props (or anything from the scope, really) in the initializer. Frankly, it looks like over-optimization to me — you're about to create a bunch of vDOM, why worry about one object? This may help with _heavy_ initialization logic, but I have yet to see such case.

On a side note, if you want to put a function in your state (it's not forbidden, is it?), you have to wrap it in an extra function to bypass the lazy initializer logic: `useState(() => () => console.log('gotcha!'))`

## You can update state with a callback

Callbacks can also be used for updating state — like a mini-reducer, sans the action. This is useful since the _current state value_ in your closure may not be the value if you've updated the state since rendering / memoizing. Better seen by example:

```js
const [clicks, setClicks] = useState(0);
const onMouseDown = () => {
    // this won't work, since clicks does not change while we're here
    setClicks(clicks + 1);
    setClicks(clicks + 1);
};
const onMouseUp = () => {
    // this will
    setClicks(clicks + 1);
    // see, we read current clicks here
    setClicks(clicks => clicks + 1);
};
```

Creating constant-reference callbacks is more practical:

```js
const [isDown, setIsDown] = useState(false);
// bad, updating on every isDown change
const onClick = useCallback(() => setIsDown(!isDown), [isDown]);
// nice, never changes!
const onClick = useCallback(() => setIsDown(v => !v), []);
```

## One state update = one render in async code

React has a feature called _batching,_ that forces multiple setState calls to cause _one_ render, but is's not always on. Consider the following code:

```js
console.log('render');
const [clicks, setClicks] = useState(0);
const [isDown, setIsDown] = useState(false);
const onClick = () => {
    setClicks(clicks + 1);
    setIsDown(!isDown);
};
```

When you call `onClick`, the number of times you `render` depends on how, exactly, `onClick` is called (see [sandbox](https://codesandbox.io/s/setstate-multi-29z2u?file=/src/App.js)):

- `<button onClick={onClick}>` is batched as a React event handler
- `useEffect(onClick, [])` is batched, too
- `setTimeout(onClick, 100)` is _not_ batched and causes an extra render
- `el.addEventListener('click', onClick)` is _not_ batched

This [should change](https://github.com/reactwg/react-18/discussions/21) in React 18, and in the meantime you can use, ahem, `unstable_batchedUpdates` to force batching.

---

To recap (as of v17.0):

- `setState` in `[state, setState] = useState()` is the same function on every render
- `setState(currentValue)` does nothing, you can throw `if (value !== currentValue)` away
- `useEffect(() => setState(true))` does not break the effect cleanup function
- `useState` is implemented as a pre-defined reducer in react code
- State initializer can be a calback: `useState(() => initialValue)`
- State update callback gets current state as an argument: `setState(v => !v)`. Useful for `useCallback`.
- React _batches_ multiple setState calls in React event listeners and effects, but not in DOM listeners or async code.

Hope you've learnt something useful today! If exploring obscure react corners is your thing, see if there's [something about DOM refs you didn't know](/2021/05/17/everything-about-react-refs) or [what useRef and useMemo have in common.](/2021/04/05/useref-usememo)
