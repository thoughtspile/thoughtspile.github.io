---
title: useLayoutEffect is a bad place for deriving state
date: 2021-09-21
tags:
  - react
  - programming
  - frontend
  - hooks
---


Today we'll talk about updating state inside useLayoutEffect in reaction to prop changes. Will it work? Is it safe? Are there _better_ ways to implement such state changes? TLDR: it works, but leaves you with an extra DOM update that may break stuff.

As we all know, useLayoutEffect is called before the browser has painted the DOM. This might lead you to believe it's OK to create derived state with useLayoutEffect — we'll immediately update with the new state, and the user won't notice anything, right? As we'll shortly see, wrong. Let me introduce an example — transition manager.

```jsx
const Transition = ({ children, active }) => {
  const prevActive = useRef(null);
  const [exiting, setExiting] = useState(null);
  useLayoutEffect(() => {
    prevActive.current && setExiting(prevActive.current);
    prevActive.current = active;
  }, [active]);
  return (<div onTransitionEnd={() => setExiting(null)}>{children.map(c => {
    const isExiting = c.key === exiting;
    if (c.key !== active && !isExiting) {
      return null;
    }
    // assume a suitable transform + transition on .exit
    return (<div key={c.key} className={isExiting ? "exit" : ""}>{c}</div>);
  })}</>);
};
```

`Transition` accepts app screens as keyed children and only renders the one with `active` key, but also adds a nice effect when moving between the screens — like a lightweight react-transition-group. For that, we keep the previously active child mounted while the transition is playing — that's handled by `exiting`. When `active` changes, we activate `exiting`, play the animation, then remove `exiting`. Should be good.

But (see for yourself [in the codesandbox](https://codesandbox.io/s/funny-goodall-txp3m?file=/src/App.js)) the transition doesn't play. What went wrong? Thinking about it, useLayoutEffect lets you peek into the actual DOM created by your render. So, even though the browser didn't paint, the DOM for the "virtual" state was there. The DOM sequence is:

1. DOM is `<Screen1 />`, as expected
2. paint
3. Change DOM to `<Screen2 />` __(OH SHI)__
4. Change DOM to `<Screen1 exiting /><Screen2 />`, as expected
5. paint, paint, paint transition frames
6. Change DOM to `<Screen2 />`, as expected
7. paint

While changing the DOM to `<Screen2 />` for a moment without even painting seems like nothing, it's not. Instead of setting a class on the exiting screen1 and rendering screen2, react unmounts screen1, then mounts screen2 and еру exiting screen1, leaving us with a whole extra screen1 remount. Being wasteful is not the main problem here. The browser loses track of screen1 in between remounts, thinks the screen with the "exiting" class had just appeared out of nowhere, and doesn't play the transition.

Technically, we could work around this by replacing transition with an animation, but that would still leave us with a useless remount (whole screens are rather heavy) and lost DOM state (like the inner scrolls in screen1 would get unset, leading to strange flickering). We obviously need to activate `exiting` and change `active` in the same render — but how can we do that?

## Derived state

So, as far as we know, setting state derived from props in an effect causes a parasitical DOM update that is wasted at best, and may break stuff. So, the state model that requires us to change state in reaction to prop change will not work. Let's find a more suitable state model, then!

When your state is purely derived from props, it's an easy feat:

```js
const [fullName, setFullName] = useState('');
useLayoutEffect(() => {
    setFullName(`${props.firstName} ${props.lastName}`);
}, [props.firstName, props.lastName]);

// becomes...
const fullName = useMemo(() => {
    return `${props.firstName} ${props.lastName}`,
}, [props.firstName, props.lastName]);

// useMemo is obviously optional:
const fullName = `${props.firstName} ${props.lastName}`;
```

Our case is more complex, since we want to derive state from props, but _also_ to set it imperatively from `onTransitionEnd`. For that, we need to _decompose_ the state into a part that depends on props, and some other state doesn't need to be updated on prop change. An alternate model that cleanly plays with react here would be:

1. `props.active` is the currently active screen
2. `lastSettled` via `useState` is the last screen we've cleanly transitioned to

Transition then plays as long as `lastSettled !== props.active`, and `lastSettled` is updated on transition end. Once you know the trick, the code is straightforward:

```jsx
const Transition = ({ children, active }) => {
  const [lastSettled, setLastSettled] = useState(active);
  const exiting = lastSettled === active ? null : lastSettled;
  return (<div onTransitionEnd={() => setLastSettled(active)}>
    {children.map(c => {
      // same as before
      const isExiting = c.key === exiting;
      if (c.key !== active && !isExiting) {
        return null;
      }
      return (<div key={c.key} className={isExiting ? "exit" : ""}>{c}</div>);
    })}
  </div>);
};
```

It works [(sandbox)](https://codesandbox.io/s/funny-goodall-txp3m?file=/src/App.js), and it's brilliant! The transition now plays, we get exactly 3 renders and 3 DOM updates, and we _also_ handle a tricky case when `active` changes again while playing transition: in our previous model, we would abruptly finish the `s1 -> s2` transition and transition again `s2 -> s3`, while here the transition changes to `s1 -> s3`. Also, `s1 -> s2 -> s1` transition is automatically canceled and needs no special handling.

## Buffering prop updates

The only problem with our "find the right model" approach is is that doing it is much harder than saying. I'm not some state genius, and honestly spent a whole day trying different options, and the final idea only came once I gave up and opened a beer. We need something more reliable and reproducible.

We can't set `exiting` state immediately when `props.active` changes (bring setState closer to props change). Instead, we can make `active` and `exiting` change simultaneously by delaying the `active` update. Let's ignore `props.active` during render, but use an effect to copy it into `state.active` (setting `exiting` simultaneously) and render based on the state. I'd call this technique "buffering":

```jsx
const Transition = ({ children, active: _active }) => {
  const [{ active, exiting }, setTransition] = useState({
    active: _active,
    exiting: null,
  });
  useLayoutEffect(() => {
    // this line skips transition on mount
    if (_active !== active) {
      setTransition({ active: _active, exiting: active });
    }
  }, [_active]);
  return (<div onTransitionEnd={() => setTransition({ active })}>
    {children.map(c => {
      // same as before
      const isExiting = c.key === exiting;
      if (c.key !== active && !isExiting) {
        return null;
      }
      return (<div key={c.key} className={isExiting ? "exit" : ""}>{c}</div>);
    })}
  </div>);
};
```

This works, too (see [the sandbox](https://codesandbox.io/s/funny-goodall-txp3m?file=/src/App.js) again). The DOM sequence here is:

1. `<screen1 />`
2. `<screen1 />` again with prop `active="v2"` — not a big deal, React handles that
3. `<screen1 exiting /><screen2 />` our transition, rendered cleanly
4. `<screen2 />`

Much better! We haven't completely eliminated a parasitical render, but instead of a full `<screen1 />` remount we just compare the vDOM and do nothing with the real DOM.

## Stuff that didn't work

### setState in render

As a dirty experiment, we could skip the `effect` and set state in render just to see what happens:

```jsx
const Transition = ({ children, active }) => {
  const prevActive = useRef(null);
  useEffect(() => {
    prevActive.current = active
  }, [active]);
  const [exiting, setExiting] = useState(null);
  if (active !== prevActive.current) {
    setExiting(prevActive.current);
  }
  // etc
};
```

As expected, this is a clusterfuck — the renders triggered by `setExiting` appear to run, but the resulting DOM is ignored and react appears to throw away the state update (`exiting` is not there on the next normal render).

### Fancy "semi-state" hook

As we've discovereed, there is no way to set state after a prop update without an itermediate DOM update. But you know what can be set during render? A `ref`! We set the ref synchronously inside render, we unset it as usual on transition end. Since assigning to `ref.current` does not trigger a re-render, we also force rerender by "setting" a useless state. Here you go:

```js
const Transition = ({ children, active }) => {
  // basic usePrevious technique
  const prevActive = useRef(null);
  useEffect(() => {
    prevActive.current = active
  }, [active]);
  // exiting "state"
  const exiting = useRef(null);
  // useless state to force rerender on transition finish
  const rerender = useState({})[1];
  function flushExiting() {
    // unset exiting "state"
    exiting.current = null;
    // force rerender
    rerender({});
  }
  if (active !== prevActive.current) {
    // immediately set exiting "state" on change
    exiting.current = prevActive.current;
  }
  // as before
};
```

This appears to work in react basic mode, but, as expected when setting ref inside render, _will not work in concurrent mode™_ Without getting into too much detail, the ref is shared between currently mounted and WIP branches, and both can unexpectedly set or unset it.
</details>

---

So, wrapping up:

1. Calling synchronizing state to props in `useLayoutEffect` makes react put the real DOM into an inconsistent state for a moment.
2. This parasitical render might be just wasted cycles, but can also mess with your CSS transitions and lose DOM state (like scrolls and focus).
3. The best approach is to come up with another state model that does not require you to change anything based on a prop change, but this might not always be trivial.
4. A simpler way is to "delay" the prop udate by copying the prop into a state, and then updating it together with the derived state.
