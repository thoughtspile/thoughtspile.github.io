---
title: Can we useRef, but without the .current? Let's try!
date: 2021-10-25 20:19:07
tags:
  - react
  - hooks
  - javascript
  - frontend
---


Ah, `ref.current`. Everybody knows that I love `useRef` — I've [built custom `useMemo` with it,](/2021/04/05/useref-usememo/) and I've used it [instead of `useState` to optimize re-renders.](/2021/10/18/non-react-state/) But typing `ref.current` over and over is just annoying. Come on, Vladimir, `startX.current` is just the same as `this.startX` in a class, I told myself a million times, but it just doesn't work.

I think `ref.current` annoys me because it exists just to please the computer — I mean, mr. React, do you think I want a `.stale` value, or a `.future` one? Of course I'd like `.current`, could you please get it for me? Doing _any_ work that can (or feels like it can) be automated is always annoying — you know what I mean if you ever had to write ES5 code without babel or struggled to sort imports for eslint without `--fix`.

In today's article, we embark on a journey to kill all `.current` (or at least _some_). We'll understand why it exists in the first place, see some practical cases when it can be avoided, and then, just for entertainment, see what the world wihout `.current` could have been.

## Why do we need ref.curernt at all?

A brief recap if you're unsure why `useRef` exists. React function component is, obviously, a JS function that accepts `props` as an argument and returns some vDOM. Different props come in through an argument, so you might guess that React calls that function on every render:

```jsx
function Clicker({ children }) {
  // one call = one render
  return <div>{children}</div>;
}
```

But if you declare a `let` variable in your component, it will be re-initialized to its initial value on every render, forgetting anything you may have assigned to it. Here, `clicks` will be back to zero if `Clicker`'s parent re-renders:

```jsx
function Clicker({ children }) {
  let clicks = 0;
  const onClick = () => console.log(clicks++);
  return <div onClick={onClick}>{children}</div>
}
```

Moving the declaration outside the function solves the reset issue, but now all instances of our component share the same value, which is probably not what you want:

```jsx
let clicks = 0;
function Clicker({ children }) {
  // total number of clicks on all Clickers in our app ever
  const onClick = () => console.log(clicks++);
  return <div onClick={onClick}>{children}</div>
}
```

Hence, react has a `useRef` hook that magically stores one value per component instance and persists it between re-renders:

```jsx
function Clicker({ children }) {
  const clicks = useRef(0);
  const onClick = () => console.log(clicks.current++);
  return <div onClick={onClick}>{children}</div>
}
```

Note that the value we care about now lives in a `.current` property of some object. This solves two problems:

- React can't capture a new value from `clicks = clicks + 1`, since you can't observe assignments in JS.
- The _wrapper object,_ also known as a _box,_ has a constant reference that lets callbacks cached in past renders read a "value from the future" — otherwise, they'd be stuck with a stale one.

So, `useRef` lets us persist a mutable value between re-renders by putting it into a `current` property of a constant-reference box object. Looks like every part is necessary. But what if we don't always need to carry the whole box around?

![](/images/cat-ref.jpg)

## Skip .current for constants

If the value wrapped in `useRef` actually never changes, we can dereference right in the declaration:

```js
const [clicks, setClicks] = useState(0);
const onClick = useRef(() => setClicks(c => c++)).current;
// now we can just
onClick={onClick}
// instead of
onClick={() => onClick.current()}
```

This works because you never assign current, and don't need the _box_ to preserve the reference because the inner reference is just as stable. Whether you should use this to cache callbacks or just `useCallback` is another question. Anyways, this works for any value you'd like to reliably cache forever:

```js
const initialValue = useRef(props.value).current;
return <input
  data-changed={props.value !== initialValue}
  {...props}
/>
```

Don't carry the box around if the contents never change.

## Skip .current for mutable objects

Storing constant values in a ref is not the most obscure use case, but still a fairly specialized one. But when you're storing a mutable object in a ref without reassigning it, you're still working with a _constant_ — sure, the contents of your object change, but the reference is stable, so the trick above still applies. If you feel like this is against hooks, or will cause any trouble, please see [my older post on `useState(object)` vs many `useStates`](/2021/10/11/usestate-object-vs-multiple/) (spoiler: it's OK and even preferable for related values).

For instance, here's what I often use for gesture tracking:

```jsx
function Swiper(props) {
  const el = useRef();
  const gesture = useRef({
    startX: 0,
    startY: 0,
    startT: 0,
  }).current;
  const onStart = (e) => {
    // ah, it's so nice to skip gesture.current.startX
    gesture.startX = e.touches[0].clientX;
    gesture.startY = e.touches[0].clientY;
    gesture.startT = Date.now();
  };
  const onMove = (e) => {
    const x = e.touches[0].clientX;
    const y = e.touches[0].clientY;
    // no .current is amazing
    el.current.style.transform = `translate(${x - gesture.startX},${y - gesture.startY},0)`;
  };
  return <div
    ref={el}
    onTouchStart={onStart}
    onTouchMove={onMove}
    {...props} />;
}
```

We've grouped the three variables we track during a gesture into a single object ref. I think it's more convenient, and communicates the intent better than just having some separate refs floating around your code with no clear relationship.

So, if your ref contents is a _box_ itself, you don't need one more box to carry the first one around. Also, if you have several related refs anyways, why not put them into one box?

## Fragile corner-cases

That's it for the stuff I use frequently. There are two more cases that work the same with or without a `useRef`, but they're very fragile and I wouldn't rely on these. Still, they'd be interesting to cover.

### Constant component

OK, `let` variable resets on re-render. Then, if our component _never_ re-renders, maybe we're safe skip the `useRef` and just use a `let`:

```jsx
const Icon = memo(() => {
  let clicks = 0;
  const onClick = () => {
    clicks++;
    console.log(clicks);
  };
  return <SomeStaticSVG onClick={onClick} />;
}, () => true);
```

Not _using_ any props in a component and slapping a `memo` on it is not enough — we could pass a useless prop and change it, like `<Icon gotcha={Math.random()} />` — React doesn't know if we care for `gotcha`. An extra hint in our memo comparator does the job. Hooks that can re-render our component are a no-go, too — `useState`, `useReducer`, `useContext`, or any custom hooks based on these.

Components like this one are not as useless as you might think — I've actually made an optimized icon pack with a similar pattern. Still, the lack of props is very limiting. But the major problem with this code is that React doesn't give any guarantees about `memo` — at some point it might start discarding old values to free memory, resetting your precious clicks. Dangerous!

### Constant callbacks

A slightly more practical (yet still sloppy) scenario is using a _ref_ only inside callbacks that are created in the first render and cached forever. Yes, we reset the value on every render, but who cares if all the function that use it are stuck in the scope of the first render:

```jsx
function Swiper(p) {
  let clicks = 0;
  const onClick = useRef(() => {
    clicks++;
    console.log(clicks);
  }).current;
  return <div onClick={onClick}>click me</div>
}
```

`useCallback(..., [])` won't cut it, since, again, react does not actually guarantee it will cache forever. With an explicit constant `useRef` we're safe, but the whole thing explodes if you ever need to capture a state/props in a callback, and rewrite it to `useCallback` or remove caching altogether. Not recommended.

## Going beyond with objects.

For the sake of an argument, let's assume I find `.current` absolutely inacceptable for religious reasons. What could I do to never type it again? There's a whole bunch of solutions if I'm really determined.

A least adventurous option is a custom hook that's just like a default ref, but replaces `current` with a different name. `v` is fine — it's short, it stands for Value, and it's a fine-looking letter. Here we go:

```jsx
// inner object is the ref-box now
const useV = (init) => useRef({ v: init }).current;
// use as follows
const startX = useV(0);
return <div
  onTouchStart={(e) => startX.v = e.clientX}
  onTouchMove={(e) => setOffset(e.clientX - startX.v)}
  style={{ transform: `translateX(${offset}px)` }}
>{children}</div>
```

But that's boring. What if we always put all the refs in a component into a large object? Anything we can do with multiple refs is doable with a single one. Looks like something a person who hates hooks but is forced to use them could do:

```jsx
// hope you're old enough to get this hommage
const that = useRef({
  startX: 0,
  // WOW we can even have CLASS METHODS back!
  onTouchStart(e) {
    this.startX = e.clientX;
  },
  onTouchMove(e) {
    // And call state update handles since they're stable
    setOffset(e.clientX - this.startX);
  },
}).current;
return <div
  onTouchStart={that.onTouchStart}
  onTouchMove={that.onTouchMove}
  style={{ transform: `translateX(${offset}px)` }}
>{children}</div>
```

The fact that we can have _methods_ on that large stateful object is very exciting. On a sadder note, we can't read current props or state, because they don't have a stable reference. We could start copying props into `that`, but the very idea of "current props" [gets fuzzy](https://github.com/facebook/react/pull/18545) once you enter concurrent mode, and I'm not going to die on this (ha, `this`) hill, or at least not today.

In an unexpected twist, we could even move ref management into a HOC. Remember [createReactClass?](https://reactjs.org/docs/react-without-es6.html) Well, it's back:

```jsx
const makeComponent = descriptor => props => {
  const scope = useRef(descriptor).current;
  return scope.render(props);
};
const Swiper = makeComponent({
  // you can't use arrows because you need "this"
  render(props) {
    // any hooks in render() are OK:
    const [value, setValue] = useState(0);
    return <div onClick={this.onClick} {...props} />;
  },
  clicks: 0,
  onClick() {
    console.log(this.clicks++);
  },
});
```

Apart from the missing props / state access, these solutions have other downsides:

- We create an extra object on each render and throw it away. A custom lazy-initializing `useRef` can work around that, though.
- Like all object-based code, they minify a bit worse than "atomic refs", because property names are not mangled (see my earlier [benchmark of atomic vs object state](/2021/10/11/usestate-object-vs-multiple/)).

Anyways, `{ current }` is not the only object shape that could work as a ref. What else can we do?

## And even further with callbacks

Objects are not the only JS thing that can be a stable container for a changing value. Let's try a function instead! (Don't get me started with `(() => {}) instanceof Object`, functions are clearly not objects). First, let's try a polymorphic handle that can both get and set the value:

```jsx
function useFunRef(init) {
  const ref = useRef(init);
  const handle = useRef((...args) => {
    // if we pass an argument, update the value
    if (args.length) {
      ref.current = args[0];
    }
    return ref.current;
  }).current;
  return handle;
}
```

Using it is simple: you either call the handle with no arguments to get the current value, or with a new value to update:

```jsx
const [offset, setOffset] = useState(0);
const nodeRef = useFunRef();
const startX = useFunRef(0);
return <div
  onTouchStart={(e) => startX(e.touches[0].clientX)}
  onTouchMove={(e) => setOffset(e.touches[0].clientX - startX())}
  ref={nodeRef}
  style={{ transform: `translateX(${offset}px)` }}
>{children}</div>
```

I like how this one integrates with DOM refs thanks to the callback-ref syntax. As an added advantage, functions should be faster to create (then throw away) than objects. And, since you're using more functions, your programming clearly becomes more functional.

If you don't like functions that do different things depending on the number of arguments, we can separate the getter and the setter, similarly to what `useState` does:

```jsx
function useStateRef(init) {
  const ref = useRef(init);
  const setter = useRef((v) => ref.current = v).current;
  const getter = useRef(() => ref.current).current;
  return [getter, setter];
}
// usage example
const [startX, setStartX] = useStateRef(0);
return <div
  onTouchStart={(e) => setStartX(e.clientX)}
  onTouchMove={(e) => setOffset(e.clientX - startX())}
>{children}</div>
```

So yes, a function can be a ref-box, too. That's good to know. Is there anything else?

## Nothing can stop me now

Until now, we've been playing with the _box_ shape without straying too far from the overall concept. But maybe that's what we call "a poultice for a dead man" in Russia? (_English tip: a poultice is a warm bag of herbs used in traditional medicine. It surely won't help if you're dead. I learnt this word just to write this post._) What if we don't need a box?

Component scope resets on every render. Fine, we need another scope to store our value. Module scope is too drastic — can we just get one that persists between re-renders, but is unique to every component? I'm the master of my scopes, so why not:

```jsx
function makeClicker() {
  // this is the outer / instance scope
  let clicks = 0;
  // we can declare callbacks here
  const onClick = () => console.log(clicks++);
  return (props) => {
    // this is the inner / render scope
    return <div onClick={onClick} {...props} />;
  }
}
function Clicker(props) {
  // Now we need to manage the instance scope
  const render = useRef(makeClicker()).current;
  // and turn it into a regular component
  return render(props);
};
```

While we're at it, more of the same can be done with a generator — sure, we can only `return` once, but why not `yield` our JSX on every render instead?

```jsx
function* genClicker(props) {
  let clicks = 0;
  const onClick = () => console.log(clicks++);
  while (true) {
    props = yield (<div
      onClick={onClick}
      {...props}
    />);
  }
}
function Clicker(props) {
  const render = useRef(genClicker(props)).current;
  return render.next(props).value;
}
```

In both cases, we can't use hooks in the _outer scope_. If we were to turn `clicks` into state, we couldn't do it like this:

```jsx
const makeClicker = () => {
  const [clicks, setClicks] = useState(0);
  const onClick = () => setClicks(c => c + 1);
  return (props) => {
    return <div onClick={onClick}>{clicks}</div>;
  }
};
```

It doesn't explode, since we happen to call `useState` on every render (because we call `makeClicker` on every render and throw it away), but `clicks` will be stuck at 0 — it's a `const` from the first render. We're free to use hooks both in our _inner scope_ and the `Swiper` wrapper, though. This also means that we can't use our outer refs to cache state update / dispatch handles, which I liked very much.

These concepts are very interesting, because they're in line with the hooks mindset: minimal object use (good for memory & minification) and creative handling of JS scopes. At the same time, we don't need an object box to host our ref! Also, if we manage to build a _lazy ref_ for out instance scope, we skip recreating useless variables and callbacks on every render, which is pleasant. The syntax and the limitations on hooks in the outer scope are sad, but I feel like they can be worked around (maybe something like `clicks = yield useGenState(0)`). Promising.

---

In this article, we've seen why `useRef` has that weird `.current` property, and learnt some tricks to write `.current` less:

- Dereference constant values during creation: `const onClear = useRef(() => setValue('')).current;`
- Combine several `refs` into a mutable ref-object, and mutate that instead of `current`: `pos = useRef({ x: 0, y: 0 }).current`, read with `pos.x`, write with `pos.x = e.clientX()`

In some cases, you could drop the `useRef` and use a simple `let` variable instead, but I don't recommend it.

To stimulate our imagination, we've also implemented _seven_ alternate APIs on top of the default `useRef` that don't use `.current`:

- One with an alternate property name: `useV(0).v`
- _Stateful core_ that's surprisingly similar to a class component.
- A `makeComponent` factory that lets you put the render function, along with some properties and methods, into an object, yet still allows for hooks.
- Two function-based `useRefs`: a `useState`-like one that has separate get and set handles: `const [getX, setX] = useStateRef(0)`, and one with a single handle.
- A component with two scopes: one that persists throughout re-rendering and can host ref-like mutable variables, and one that actually renders the JSX. We've also made a similar one with generators.

Maybe this wasn't very useful (I'm not eager to rewrite all my code using these patterns), but I hope it was great fun (it sure was for me). React is amazingly flexible, which is why I love it. Hope this mental exercise got you excited. See you later!