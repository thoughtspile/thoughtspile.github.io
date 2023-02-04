---
title: So you think you know everything about React refs
date: 2021-05-17
tags:
  - react
  - programming
  - frontend
  - hooks
---


React [refs](https://reactjs.org/docs/refs-and-the-dom.html) appear to be a very simple feature. You pass a special prop to a DOM component, and you can access _the current DOM node_ for that component in your JS. This is one of those great APIs that work just the way you'd expect, so you don't even think about how, exactly, it happens. Along my descent into React internals I started noticing that there was more to the ref API than I always thought. I dug deeper, and in this post I'll share my findings with you and provide a few neat ref tricks to help you write better code.

## How react refs are set

To get the basics out of the way, `ref` is set to the DOM node when it's mounted, and set to null when the DOM node is removed. No surprises this far.

One thing to note here is that a ref is, strictly speaking, never _updated._ If a DOM node is replaced by some other node (say, its DOM tag or `key` changes), the ref is _unset,_ and then set to a new node. (You may think I'm being picky here, but it's goint to prove useful in a minute.) The following code would log `null -> <div>` on rerender (also see <a target="_blank" href="https://codesandbox.io/s/stoic-tereshkova-h51o2?file=/src/App.js">sandbox</a>):

```jsx
const ref = useCallback((e) => console.log("ref", e), []);
const [iter, rerender] = useState(0);
return (
  <div ref={ref} key={iter} onClick={() => rerender(iter + 1)}>
    click to remount
  </div>
);
```

The part I was not aware of is that the identity of `ref` prop also forces it to update. When a `ref` prop is added, it's set to DOM node. When a `ref` prop is removed, the old ref is set to null. Here, again, the ref is unset, than set again. This means that if you pass an inline arrow as a `ref`, it'll go through _unset / set_ cycle on every render ([sandbox](https://codesandbox.io/s/reverent-stallman-swv7q?file=/src/App.js)):

```jsx
const rerender = useState()[1];
return (
  <div ref={(e) => console.log("ref", e)} onClick={() => rerender({})}>
    click to remount
  </div>
);
```

So, why does it work that way? In short, it allows you to attach `refs` conditionally and even swap them between components, as in

```jsx
<ul>
  {items.map((e, i) => (
    <div ref={i === items.length - 1 ? lastRef : null}>{e.text}<li>
  ))}
</ul>
```

So far we've leant that refs are _set_ node when the DOM mounts _or_ when the ref prop is added, and _unset_ when the DOM unmounts _or_ the ref prop is removed. As far as I'm concerned, nothing else causes a ref to update. A changing ref always goes through `null`. If you're fluent in hooks, it works as if the code for DOM components had:

```jsx
useLayoutEffect(() => {
    ref.current = domNode;
    return () => ref.current = null;
}, [ref]);
```

## Ref update ordering

Another important principle specifies the order in which refs are set and unset. The part we rely on the most is that the ref is always set _before_ `useLayoutEffect / componentDidMount / Update` for the corresponing DOM update is called. This, in turn, means that `useEffect` and parent `useLayoutEffect` are also called after the ref is set.

In a single render, all the ref _unsets_ happen before any _set_ — otherwise, you'd get a chance to unset a ref that's already been set during this render.

Next, `useLayoutEffect` cleanup during re-rendering runs right between ref unset and set, meaning that `ref.current` is always `null` there. To be honest, I'm not sure why it works this way, as it's a prime way to shoot yourself in the foot, but this seems to be the case for all react versions with hooks. [See for yourself](https://codesandbox.io/s/polished-sunset-fbs6q?file=/src/App.js).

In contrast, `componentWillUnmount` and unmount `useLayoutEffect()` cleanup are called _before_ the ref is unset, so that you get a chance to cleanup anything you've attached to the DOM node, as you can see in a [sandbox](https://codesandbox.io/s/determined-hamilton-05t27?file=/src/App.js).

Here's a chart that summarizes all this timing:

![](/images/react-ref-order.png?invert)

Now I feel like we're getting somewhere in our understanding of `refs` — but does it have any practical value? Read on!

## Don't use ref.current in useLayoutEffect cleanup

First off — using dynamic refs in `useLayoutEffect` cleanup callback is unsafe since you can get an unexpected `null`. Store `ref.current` in a closure variable and use that instead:

```jsx
useLayoutEffect(() => {
  ref.current.addEventListener('click', onClick);
  return () => ref.current.removeEventListener('click', onClick);
}. [onClick]);
// becomes...
useLayoutEffect(() => {
  const node = ref.current
  node.addEventListener('click', onClick);
  return () => node.removeEventListener('click', onClick);
}. [onClick]);
```

Granted, this only works for arrow refs or when you attach a ref conditionaly, but better safe than sorry, right? At least it's good to know exactly why this breaks and not wrap everything in `if (ref.current)` just in case.

## You can side effect in ref callback

A cool and useful implication of this is that you can safely put expensive side effects in a callback ref (or a `set current()` of a ref object) as long as ref identity does not change. For example, a typical DOM measuring logic:

```jsx
const el = useRef();
const [size, setSize] = useState();
useLayoutEffect(() => {
    setSize(el.current.getBoundingClientRect());
}, []);
return <div ref={el}>{children}</div>;
```

Becomes...

```jsx
const [size, setSize] = useState();
const measureRef = useCallback(node => {
    setSize(node.getBoundingClientRect())
}, []);
return <div ref={measureRef}>{children}</div>;
```

Which is slightly cleaner and has one variable less.

## Ref arrows

There's a subtle difference between having an arrow as your `ref` prop and a ref object or a stable callback —  the arrow has a new identity on every render, forcing the ref to go through an update cycle `null`. This is normally not too bad, but good to know.

```jsx
// this does node -> null -> node on every render
<div ref={e => this.node = e} />
// this doesn't
<div ref={useCallback(e => this.node = e, [])} />
// neither does this
setRef = e => this.node = e;
<div ref={this.setRef} />
// this is fine, too
const ref = useRef();
<div ref={ref} />
```

## setState can be a callback ref

If you want setting ref to trigger a rerender, you can just pass `setState` updater as a ref prop. This code will give `children` access to root DOM node, and will not fall into infinite re-rendering or anything:

```jsx
const [root, setRoot] = useState();
return (
    <div ref={setRoot}>
        <RootContext.Provider value={useMemo(() => root, [root]))}>
            {root ? children : null}
        </RootContext.Provider>
    </div>
);
```

## Merging refs is hard

Finally, if you implement some kind of ref merging (when you have a `forwardRef` / `innerRef`, but also need te DOM node for yourself), you should take care to preserve the guarantees native ref provides, because they are there for a reason. Almost all ref merging mechanisms I've seen in the wild miss some points we've discussed today. The web is full of tutorials that offer you subtly broken solutions. A library with 22K stars [fails to do it right.](https://github.com/streamich/react-use/blob/master/src/useEnsuredForwardedRef.ts) Here's [my best shot](https://github.com/VKCOM/VKUI/blob/master/src/hooks/useExternRef.ts) at this problem, and I'm still not sure it ticks all the boxes:

```jsx
function useExternRef(externRef) {
  const stableRef = useRef();
  return useMemo(() => ({
    get current() {
      return stableRef.current;
    },
    set current(el) {
      stableRef.current = el;
      setRef(el, externRef);
    },
  }), [externRef]);
}
```

Knowing this, I wouldn't be comfortable with any advanced ref patterns (conditional refs / side effects) on non-DOM components.

---

Now on to a brief recap:

- Refs are set when the DOM is mounted or a `ref` prop is added.
- Refs are unset when the DOM is removed or a `ref` prop is removed.
- Refs are always unset, then set, and never switch between two nodes directly.
- It's safe to use `refs` conditionaly and even move them between nodes.
- The order in which refs are set and unset relative to `useLayoutEffect` and lifecycle hooks is well defined.
- Callback ref can be a side effect or a `useState` setter
- Useing `ref.current` in `useLayoutEffect` cleanup is unsafe.
- Merging refs is hard, so take care yourself and don't trust the `ref` prop in components you didn't write.

Phew. Now I think we really know everything about react refs.
