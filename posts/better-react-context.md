---
title: Why I always wrap Context.Provider and useContext
tags:
  - react
  - programming
  - frontend
  - hooks
date: 2021-10-27
---


React context is a cool feature, and I use it a lot for injecting configuration and making container / child component APIs (think `<RadioGroup /> + <RadioButton />`). Unfortunately, out of the box Context comes with a limiting and not very convenient API. In most cases, I choose to wrap both the provider and consumer with a custom component and a hook. Some of the issues I highlight are more relevant to library maintainers, but most apply to app development as well.

In this post, we revisit an `AdaptivityContext` that allows components to read viewport dimension data — pixel `width` and breakpoint status, `isMobile`:

```jsx
const getWidth = () => window.innerWidth;
const isMobile = (w: number) => w < 600;
const AdaptivityContext = createContext({
  w: getWidth(),
  isMobile: isMobile(getWidth),
});
```

If you've read my [post on Context performance issues,](/2021/10/04/react-context-dangers/) you know it is not the best design choice — components that only care about `isMobile` will still re-render on every `width` change. Still, suppose that's what we happen to have on our project. How can custom `AdaptivityProvider` and `useAdaptivity` help us?

![](/images/wrapped-context.jpg)

## Wrap useContext

In raw context API, the consuming components utilize `useContext` hook (or a `Context.Consumer` component, but I don't know why anyone would choose it over the hook today). There's nothing especially wrong with `useContext`, but we can do so much better with a custom `useAdaptivity`!

If `useContext` is used outside `Provider`, you're left with either a static default value from `createContext` or cryptic _can't read property width of null_ errors. Sometimes it's enough, but `AdaptivityContext` is supposed to be dynamic, and we get a lot of "bug reports" that are fixed with a "did you forget the provider?". A custom `useAdaptivity` gives us two stronger options:

1. Show an explicit error message, like `console.error('useAdaptivity must be used inside AdaptivityProvider')`
2. Give each component an independent size observer, and make `AdaptivityProvider` optional for advanced optimizations and overrides.

Next, `useContext` has a 1:1 relationship to contexts. Fixing `AdaptivityContext` performance problems involves splitting it into two separate contexts — a frequently-changing one for `width`, and a more stable one for `isMobile`. `useAdaptivity` can subscribe to both contexts — it won't have any performance benefits, but it's backwards compatible and allows users to gradually update their apps to the new API:

```jsx
const useAdaptivity = () => {
  console.warn('Please migrate to useMobile or useViewport for better performance');
  const viewport = useContext(ViewportContext);
  const mobile = useContext(MobileContext);
  return { ...viewport, ...mobile };
};
```

Custom `useAdaptivity` hook also allows for an alternate context injection mechanism, like [react-tracked](https://github.com/dai-shi/react-tracked). You can even bind to a global state manager instead of context. Nothing about `useAdaptivity` implies that it has anything to do with contexts!

So, a custom `useAdaptivity` hook gives us a lot of freedom — we can modify the contexts as we wish, replace them with other state management mechanism, and we can handle a missing provider as we see fit. That's convincing. What about `Provider`?

## Wrap Context.Provider, too

`React.createContext` gives you a `Context.Provider` component you're supposed to use for passing a context value. It lacks some important features, but we can easily fix that by wrapping it into a custom `Provider` component.Frankly, it's less of a concern than `useContext` — you often have a single `Provider`, and it has to be located in _some_ component, so you can't go too wrong. For completeness, here's what I normally do with a custom `Provider`.

Raw `Context.Provider` with object context is a performance hazard — if you don't stabilize `value` reference yourself, every context consumer will re-render on every `Provider` render, because React updates them every time context value changes under strict equality. I don't know why this feature is not in react core, but it's one good reason to have a custom provider (see my [post on custom memo](/2021/04/05/useref-usememo/) for details on `useObjectMemo`):

```jsx
const AdaptivityProvider = ({ children, ...context }) => {
  const contextValue = useObjectMemo(context);
  return (
    <AdaptivityContext.Provider value={contextValue}>
      {children}
    </AdaptivityContext.Provider>
  );
};
```

Just like `useContext`, raw `Providers` have a 1:1 relationship with contexts, making it harder to split / merge the contexts. To fix the coupling of `width` and `isMobile` updates, we must split `AdaptivityContext` into two parts. Easy with a custom provider:

```jsx
const AdaptivityProvider = ({ children, width, isMobile }) => {
  const viewportValue = useObjectMemo({ width });
  const mobileValue = useObjectMemo({ isMobile });
  return (
    <ViewportSizeContext.Provider value={viewportValue}>
      <MobileContext.Provider value={mobileValue}>
        {children}
      </MobileContext.Provider>
    </ViewportSizeContext.Provider>
  );
};
```

Just like `useAdaptivity`, `AdaptivityProvider` also allows you to replace context with any other state management technology — just throw a `<StoreProvider>` in there and you're done.

Finally, a custom provider can handle context value in a smarter way — add default options or merge with another provider up the tree. If we had both `width` and `height`, we could allow partial overrides — user could use `<ViewportSizeProvider width={100}>` in a narrow sidebar, while preserving the `height` value:

```jsx
const parentViewport = useContext(ViewportSizeContext);
const contextValue = useObjectMemo({
  ...parentWiewport,
  ...size
});
```

Of course, you could also have a custom mechanism of auto-detecting and updating context values:

```jsx
useLayoutEffect(() => {
  const cb = () => {
    setDetectedSize(getViewportSize());
  };
  cb();
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}, []);
const contextValue = useObjectMemo({
  ...detectedSize,
  ...props
});
```

You could have amazing combinations of inheritance, auto-detection and overrides. Really, there are endless possibilities once you are the master of your context provider. Just don't settle for raw `Context.Provider`.

---

Wrapping both the provider and the consumer of a context into custom hooks gives you a lot of flexibility:

- Merge and split context as you want.
- Replace raw contexts with another state injection technique.
- Stabilize context object value.
- Introduce smart dynamic defaults for context value.
- Inherit from other providers up the tree with partial overrides.
- Warn or fallback on missing provider.

This flexibility is crucial if you're building a library, but it also helps a lot in any non-trivial app. Hope that convinces you! See you later.
