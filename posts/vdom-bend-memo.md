---
title: Extravagantly fast rendering with React benders
tags:
  - react
  - programming
  - javascript
  - frontend
date: 2019-01-06
---


The other day I was working on a React-based library of huge, reusable SVG images, and I ran into performance problems. Just kidding, I've never had a problem I'm solving here, but I've had great fun working around it. I wanted to make components producing mostly static DOM as fast to render as humanly possible. And I'm not talking just about updates — I wanted to optimize mounting. Of course, normally you'd just skip remounting and hide / show the component with CSS, but that's not fun enough for me. Let's say we want to render it fast in random locations of your app.

Let's start with something simple — a component with no props. Since the renders are pure, the component always returns the same markup, which makes it a perfect candidate for our game. I know, I know, context and connected components, but let's ignore these for a while. An SVG image works well — think this one, but huge:

```jsx
const Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="192.25" height="66.056" viewBox="4.5 -5.222 192.25 66.056">
    <circle fill="#000000" cx="37.637" cy="28.418" r="28.276"/>
  </svg>
);
```

Also check out the [codesandbox](https://codesandbox.io/s/j9xp6pqo5) with the complete code.

## Pure

Our first intuitive take is to make the component pure:

```jsx
class PureIcon extends PureComponent {
  render() {
    return <Icon />;
  }
}
// or, with a dash recompose
const PureIcon = pure(Icon);
```

Fine, this helps make the updates almost free. But mounting the component still takes time. Honestly, does it make sense to build the vDOM every time we mount, given that we know it'll always be the same? No. Great, we can make it better.

## Global vDOM memoization

So, we want to cache the vDOM globally instead of building it from scratch every time we mount. Note that we can't use `_.memoize(Icon)` because Icon is still called with the props argument that gets a new reference every time. No problem, we'll write it ourselves:

```jsx
let cache = null;
const ManualMemoIcon = () => {
  if (!cache) {
    cache = <Icon />;
  }
  return cache;
};
```

So, we only build the vDOM (`<Icon />`) on the first mount, application-wide. Should be good? It's not. The premise of React that building vDOM is cheap is true, after all. Once React quickly gets the vDOM, it goes and starts building the real DOM — painfully slowly. We can strip a fraction of the mount time, but the updates were better with `Pure`. We have to skip the vDOM-to-DOM step if we want to succeed. Can I do that? You bet I can!

## DOM memoization

So, caching vDOM does not help us much — we need to cache the real DOM. The plan is simple: when we first (application-wide first) mount the component, we take the resulting DOM and put it into a variable. On subsequent mounts we don't really render anything, but clone the saved DOM subtree into our mount point. In code:

```jsx
let domCache;
class DomMemoIcon extends PureComponent {
  componentDidMount() {
    if (domCache) {
      this.el.appendChild(domCache.cloneNode(true));
    } else {
      domCache = this.el.firstChild;
    }
  }
  render() {
    // yes, there may be minor trouble with simultaneous first mounts
    const children = domCache ? null : <Icon />;
    return <div ref={e => this.el = e}>{ children }</div>;
  }
}
```

This works! In my truck benchmark, we're down from 25 to 5 ms — pretty amazing! Let's now focus on what we've lost in the process:

- No props. We can get away with some *if* we promise that they'll always be the same.
- No context, no connected children.

Sounds like a fair deal to me. But can we go faster yet? Ha-ha, we can. If you never have more than one component instance mounted at the same time, you can skip the `.cloneNode`. Or you could add instance counting to treat this as a special case.

## Adding props

But we like props, props are cool! Can we please have them back? Maybe we can. If the component's *prop space* — that is, all the prop combinations we ever use — is fairly small, we could put the DOMs for each prop object into a map of sorts: `{ [prop object] -> resulting DOM }`, then try to retrieve the DOM from cache on each mount / update. I'll leave implementing this to you as an exercise.

---

So, do I suggest actually using this? Probably not, it's very tricky and not very useful. If you can make it work for you — great, let me know. Anyways, it's very cool that we can stuff like this is doable with React.
