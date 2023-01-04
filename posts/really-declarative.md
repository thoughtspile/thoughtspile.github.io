---
title: 'Thanks React, I''m fine with an imperative setInterval'
tags:
  - react
  - hooks
  - javascript
  - frontend
date: 2021-10-13 20:55:24
---

Like many of you, I've read Dan Abramov's excellent article, [making setInterval declarative with React hooks.](https://overreacted.io/making-setinterval-declarative-with-react-hooks) It's a great introduction to hook thinking and gotchas, highly recommended to any react dev. But by now the insistence on being declarative in every hook ever has gone too far, and it's starting to annoy me. Hook libraries that don't expose imperative handles at all are less useful, and using them comes with a real performance cost. How so? Let me show.

![](/images/set-timeout.jpg)

## The example

Let's jump straight into the code. I'm building a synthetic input with a nice "info" icon that explains what this input is for when the user hovers it. To prevent any jumpiness when the user just moves the mouse around, I open the tooltip after 100ms of hovering:

```jsx
const Input = ({ details }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setHovered] = useState(false);
  useTimeout(() => {
    setShowDetails(true);
  }, isHovered ? 100 : null);
  const onEnter = () => setHovered(true);
  const onLeave = () => {
    setHovered(false);
    setShowDeatils(false);
  };
  return (
    <div>
      <input />
      <span
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >i</span>
    </div>
  );
};
```

And here's the `useTimeout` hook — I'll skip the part where Dan explains why this code looks what it looks like, please check out his [original post](https://overreacted.io/making-setinterval-declarative-with-react-hooks) if you have any questions. I only replaced the interval with a timeout, because, to tell you the truth, I have used intervals exactly zero times in the past 5 years, but I use timeouts every week.

```jsx
function useTimeout(callback, delay) {
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    if (delay != null) {
      const id = setTimeout(() => {
        savedCallback.current();
      }, delay);
      return () => clearTimeout(id);
    }
  }, [delay]);
}
```

It's a nice, consistent hook that does many things right — in fact, it's similar to my idea of [the perfect useCallback.](/2021/04/07/better-usecallback/) Let's first admire the things it does right:

- You can't forget to clear the timeout on unmount.
- You never call a stale callback.
- You don't even have to specify callback "dependencies"

But then there's something I don't like that much. To set a callback, we switch the `hovered` state. This state change triggers the effect in `useTimeout` that actually sets the timeout. _But,_ like every state change, it also happens to re-render a component. So, while we're calling our `setTimeout`, we also get to:

1. Call setState
2. Schedule a re-render
3. Call the render function
4. Produce a bunch of objects and functions for our hooks
5. Compare some dependency arrays
6. Note that `hovered` has changed, and schedule that effect from `useTimeout`
7. Generate a bunch of vDOM
8. Diff the old and new vDOMs to see that almost nothing happened
9. Bind new DOM event handlers, because their reference has changed, who knows
10. Finally, `setTimeout`!

I mean, it will all probably happen pretty fast, but come on, is calling a `setTimeout` _really_ worth all that fuss? Me, I don't think so. The idea of making my user's CPU go through all that hoops to call a function makes me very sad. Luckily, I know how to fix it.

## Give me back my imperative

What if we were to skip the _declarative_ part, and just tried to build a consistent hook wrapper around `setTimeout`? Here's my take (we use a [very similar hook](https://github.com/VKCOM/VKUI/blob/288114403c892ae11e60fe65525cdef89a272c53/src/hooks/useTimeout.ts) in our production code):

```jsx
function useImperativeTimeout(callback, delay) {
  const timeoutId = useRef(null);
  const savedCallback = useRef();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // this handle clears the timeout
  const clear = useCallback(() => {
    clearTimeout(timeoutId.current);
  }, []);
  // this handle sets our timeout
  const set = useCallback(() => {
    // but clears the old one first
    clear();
    timeoutId.current = setTimeout(() => {
      savedCallback.current();
    }, delay);
  }, [delay]);

  // also, clear the timeout on unmount
  useEffect(() => clear, []);

  return { set, clear };
}
```

We can finally call `timeout.set()` and just have it `setTimeout` for us and do nothing else. I've left the original `savedCallback` logic intact, nothing wrong with it.

> The hook behavior in some corner cases has changed. If I set the timeout to 300ms, and then 200ms later change the delay to 50ms, should it fire in 300 – 200 = 100ms, as originally intended (my behavior)? 50ms from now (Dan's behavior)? 50 – 200 = 150ms ago (haha, that's very correct but you can't do that)? RIGHT NOW if we're already past deadline? Who knows. All options are fine for such a weird case as long as it doesn't explode.

But now our `Input` has to wrangle with the nasty _imperatives,_ and it probably looks awful. Not at all:

```jsx
const Input = ({ details }) => {
  const [showDetails, setShowDetails] = useState(false);
  const showTimeout = useImperativeTimeout(() => {
    setShowDetails(true);
  }, 100);
  const onEnter = showTimeout.set;
  const onLeave = () => {
    showTimeout.clear();
    setShowDeatils(false);
  };
  return (
    <div>
      <input />
      <span
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >i</span>
    </div>
  );
};
```

In fact, we've not only eliminated the extra render, but also removed the `hovered` state whose only job was to toggle the timeout. I'd say good old imperatives just scored a goal.

## Were we imperative all along?

Upon closer inspection, our initial _"declarative"_ `useTimeout` is not that declarative. Take note:

- `onMouseOver` event handler is imperative,
- `setHovered` is imperative — even grammatically, I sometimes say "come on React, _set hovered_ to true",
- `setTimeout` is imperative, too.

We're basically converting these imperative things into the declarative world, then back again.

Moreover, the mental model is slightly broken — while `hovered` flag supposedly means "timeout is running", it may not be the case. The timeout is either running or has already fired. But maybe that's just me being tedious.

## What declarative can't do

Now suppose I want to implement a debounce with the _declarative useTimeout._ I want to track my user's mouse motion, and show a popup once he stops moving. For that, I normally set a small timeout to show the popup — 30ms will do — on `mousemove`. If the user moves the mouse again within the next 30ms, well, I set another timeout and try again. If the mouse stops, the timeout successfully fires, and the popup appears. Really simple (no React yet):

```jsx
let popupTimeout = null;
img.addEventListener('mousemove', () => {
  clearTimeout(popupTimeout);
  popupTimeout = setTimeout(showPopup, 30);
});
```

But the only way to set our _decalrative useTimeout_ is passing a non-null delay. How would you do this with our declarative timeout?

```jsx
function Img({ title, ...props }) {
  const [hasPopup, setPopup] = useState(false);
  useTimeout(() => setPopup(true), ??);
  const onMove = ??
  return <>
    <img onMouseMove={onMove} {...props} />
    {hasPopup && <div>{title}</div>}
  </>;
}
```

You could move the delay a little bit, like 30 -> 31 -> 30, or dance around with 30 -> null -> 30, but that's just dirty. In any case, `mousemove` is absolutely not the event you'd want to re-render on.

Imperative timeout to the rescue:

```jsx
function Img({ title, ...props }) {
  const [hasPopup, setPopup] = useState(false);
  const popupTimeout = useImperativeTimeout(
    () => setPopup(true),
    30);
  const onMove = popupTimeout.set;
  return <>
    <img onMouseMove={onMove} {...props} />
    {hasPopup && <div>{title}</div>}
  </>;
}
```

It works, it's fast, it's simple. 2:0 in favor of old school!

## How we can have it all

Before you point this out to me, I'd love to quote the original article's disclaimer myself: _This post focuses on a pathological case. Even if an API simplifies a hundred use cases, the discussion will always focus on the one that got harder._ I'll be the first to admit I'm now exploring a pathological case of a pathological case. Know why? Because that's the kind of stuff I enjoy.

Problem is, the fully declarative API most hooks offer is on a higher level of abstraction than imperative handles. JS culture of making lower-lever building blocks inaccessible to the library users has bothered me for a long time (ouch, I still remember that time I copy-pasted react-router source to modify link actions for an electron app). But I think this culture has probably peaked in hooks.

Declarative timeout is very convenient in many cases:

- If many different things can set a timeout — like maybe a `mousedown`, but also a `keydown` — separating cause and effect with an intermediate state works great.
- If you're going to use the state for other things, you still need to re-render, so there's no _wasted_ render.

But, as we've seen, it makes some other cases impossibly difficult, and can introduce wasted renders.

What if we could have the best of both worlds — provide a nice declarative API for 90% use cases, and also an imperative one to please old grumpy people like me? Yes we can:

```jsx
function useWrapTimeout(callback, delay) {
  const handle = useImperativeTimeout(callback, delay);
  useEffect(() => {
    if (delay != null) {
      handle.set();
      return handle.clear;
    }
  }, [delay]);
}
```

This is what you think it is — the declarative timeout, built on top of our imperative timeout. Works absolutely the same. We could even expose _both_ APIs from a single hook (just `return handle`), but the interaction between the declarative state and imperative overrides is not pleasant. On the other hand, declarative timeout can't be used to build an imperative timeout, period.

---

A traditional recap:

- Hooks without an imperative API make re-rendering the only way to communicate with the hook, which is wasteful.
- Re-rendering a component and checking if some variable has changed since last render _is_ a convoluted way to call a function.
- Communicating between imperative actions (event -> setTimeout call) through a declarative value is not always possible.
- Imperative APIs can be harder to work with, but are also more flexible.
- You can build declarative APIs on top of imperative ones, but not the other way around.

Dear library authors, please do expose lower-level APIs. Don't make me copy-paste your code to do things a little differently from the 95% use case.

Want to learn more about pathological cases in React hooks? [I have a lot of that.](/tags/hooks/) See you around!
