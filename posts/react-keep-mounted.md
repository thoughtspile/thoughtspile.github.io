---
title: Keep a React component mounted
tags:
  - react
  - javascript
  - programming
  - frontend
date: 2018-12-02
---


The second most important React optimization technique after `shouldComponentUpdate` and friends is remount management. Some portions of the UI can be hidden or shown — sidebars, drop-down menus, modals and draggable widgets are all prominent examples. The basic React pattern for conditional rendering is boolean short-circuiting:

```js
{condition && <Component data={data} />}
```

However, if you go this way, you create DOM elements every time the component is displayed. As the component grows in size, the lag between the interaction and mounting can become noticeable. You can combat this (Vue and Angular even have this functionality built-in) by keeping the component rendered unconditionally and hiding it with CSS:

```js
<div style={{ display: condition ? null : 'none' }}>
  <Component data={data} />
</div>
```

You also get to preserve `Component`'s state for free along with the DOM state (scroll, focus, and input position). However, this solution has drawbacks, too:

1. You mount the component on startup, even if the user never accesses it. Mounting multiple components at the same time can accumulate to very sluggish start-up performance.
2. You update the component even when it's invisible, which may or may not be what you want.

I'm about to propose a solution that walks the middle ground between the two: you mount the component when the user first sees it, subsequent toggles use CSS. You can also control whether you want the hidden component to update with an option — I'll provide an extended study of the use cases below.  This is more of a straw-man proposal than something I'm ready to wrap into a library, so any discussion is welcome. Play with the code (I've opted for preact to show how this method applies to any JSX-based solution) at [codesandbox](https://codesandbox.io/s/82jo98o708).

## The solution

Let's start by wrapping the CSS solution into a component with a render prop:

```js
class KeepMounted extends Component {
  render() {
    const { isMounted, render } = this.props;
    return (
      <div style={{ display: isMounted ? null : 'none' }}>
        { render() }
      </div>
    );
  }
}

// use as
<KeepMounted
  isMounted={condition}
  render={() => <Component data={data} />}
/>
```

Now we make one minor adjustment: only call `render` once `isMounted` has been set to `true` once. I do it this way:

```js
class KeepMounted extends Component {
  hasBeenMounted = false
  render() {
    const { isMounted, render } = this.props;
    this.hasBeenMounted = this.hasBeenMounted || isMounted;
    return (
      <div style={{ display: isMounted ? null : 'none' }}>
        {this.hasBeenMounted ? render() : null}
      </div>
    );
  }
}
```

You might argue that `hasBeenMounted` belongs in `state`, but in this case it works better this way. `KeepMounted` never triggers visibility change by itself, and synchronizing store and prop updates either limits compatibility with older versions of `React` given the `componentWillUpdate` havoc, or forces double rendering if using `componentDid*`. But what was that thing about bypassing updates that I wanted?

### Preventing updates

At a first glance, there's no reason to re-render the component when it's hidden. But the component can produce very different DOM depending on the state: say, it's a list that grows from 1 to 1000 items while it's hidden. In that case, updating it once it's displayed is not much cheaper than mounting it from scratch. Adding items one at a time while it's hidden will not be noticeable. There's no right solution here, simply thinking about this helps a lot.

React component updates when either their parent updates (possibly inducing prop changes), or the component's own state changes (this includes connecting to a state manager). We can bypass the update-from-parent when the component is hidden by not calling `render()`. We need some fallback elements to use — the last `render` output will do.

```js
class KeepMounted extends Component {
  children = null
  render() {
    // And I even have an option to choose the desired behaviour:
    const { isMounted, updateUnmounted, render } = this.props;
    this.children = (isMounted || updateUnmounted) ? render() : this.children;
    return (
      <div style={{ display: isMounted ? null : 'none' }}>
        {this.children}
      </div>
    );
  }
}
```

You also need the wrapped component (the one we return in `render()`) to be pure — some edge case, but its render method is called on every `KeepMounted` update if you don't do that.

Unless you're too tricky, hidden components don't call `setState` — the user has no way to interact with them. This leaves us with preventing the updates from the state manager. Careful there, if we stop listening to store updates altogether, we might render stale UI once we show it again. I haven't gone too deep, but injecting `isMounted` through the context and using it right below the connector HOC should do the trick (for HOC-based connectors).

## Alternative designs

I've also evaluated two alternative designs: using a HOC and `children`. I find the render-prop-based solution the cleanest and most convenient, but here they are for completeness.

### Higher-order component

You can obviously do that. However, render prop allows you to hide an arbitrary segment of layout instead of one single component, and you also have prop name collisions to handle (granted, `isMounted` is probably not the most popular prop name). You'll use it like:

```js
const LazyComponent = keepMounted({ updateMounted: true })(Component);
<LazyComponent isMounted={cond} data={data} />
```

### `children` trick

An interesting option since it leaves the `&&` conditional rendering pattern intact:

```js
// usage
<KeepChildrenMounted>
  { condition && <Component /> }
</KeepChildrenMounted>

class KeepChildrenMounted extends Component {
  children = null;
  render({ children }) {
    const emptyChildren = isEmptyChildren(children);

    if (!emptyChildren) {
      this.children = children;
    }

    return (
      <div style={{ display: emptyChildren ? "none" : null }}>
        {this.children}
      </div>
    );
  }
}
```

However, it requires children introspection (conveniently hidden inside `isEmptyChildren`). This is not that hard, but always feels hacky. The major problem is that it gives you an impression that you can write:

```js
<KeepChildrenMounted>
  {cond1 && <Component1 />}
  {cond2 && <Component2 />}
</KeepChildrenMounted>
```

And expect it to keep everything mounted. It is doable, but children need a `key`, you have to introspect them even more, and track it manually. Very hacky. You could also check the child count and give a warning, but you won't always hit that condition when testing.

## Lazy loading and code splitting

This pattern also enables two more interesting use cases. Since the component does not mount immediately, you can delay fetching the data needed to render it until the user sees it. Also, if the child component is heavy, you can slap a code-split boundary on it and only load the actual code when it's necessary. This way, the users who never see the component will not have to pay for using it. Very exciting.

---

The idea appears so cool and useful I'm surprised there isn't an npm module for it yet (have I looked in the wrong place?). [Play with the code](https://codesandbox.io/s/82jo98o708), choose your preferred API option, point out what gotchas I haven't thought of. Feel free to wrap it into a library yourself if you're brave enough. Above all, have a nice weekend.
