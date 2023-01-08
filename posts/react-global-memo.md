---
title: Using global memoization in React
date: 2022-02-09
tags:
  - react
  - hooks
---

When our React apps get slow, we usually turn to `useMemo` to avoid useless job on re-render. It’s a _hammer_ that often works well, and makes it hard to shoot yourself in the foot. But `useMemo` is not a silver bullet — sometimes it just introduces more useless work instead of making your app faster.

In this article, I explore the less conventional caching techniques in React that can do wonders to optimize your apps:

1. First, we must understand exactly how `useMemo` works — and why.
2. What are some use cases where `useMemo` does not help much?
3. Then, we examine four global caching methods, where cache is shared between components. As usual, they come with different tradeoffs, and some are even dangerous if used carelessly.

There’s a neat cheat sheet awaiting you at the end. Let’s dive in!

## Inside useMemo

To see if `useMemo` fits our particular use case, we must know how, precisely, it works. To quote [the docs,](https://reactjs.org/docs/hooks-reference.html#usememo) _useMemo will only recompute the memoized value when one of the dependencies has changed._ This is rather ambiguous, so let’s check against [the implementation:](https://github.com/facebook/react/blob/9d4e8e84f7fb782385d81ffcdcda73822acf4ad1/packages/react-reconciler/src/ReactFiberHooks.new.js#L1906)

1. The cache is initialized when mounting a component instance, and destroyed when unmounting.
2. The cache is never shared between different component instances.
3. The cache stores just a single value — the last one.

This is a sensible default. Storing _one_ value never leaks memory, even if you use an unstable dependency. Say our memo (and `useCallback` is just a wrapper over `useMemo`) depends on an unstable arrow, `onClick`:

```jsx
const onClick = (id) => console.log('click', id);
const handleClick = useCallback(() => {
  onClick(props.id);
}, [onClick, props.id]);
```

Now we create a new `handleClick` on every render. If `useMemo` stored all the previous values, every `handleClick` would occupy memory forever — bad. Also, storing N values requires N dependency comparisons when reading, which is N times slower than checking once. Sure, `useMemo` is worthless here, but at least it does not explode.

Localizing cache to a single component guards against missing deps. Suppose you’re sure a scope variable _never_ changes during the component lifetime, so you just omit it from the dependency array:

```jsx
const [clicks, setClicks] = useState(0);
const handleClick = useCallback(() => { 
  setClicks(c => c + 1);
}, []);
```

_If_ the cache was shared among multiple components, distinct `handleClick`s would call the same `setClicks`, so only one counter would increment — unexpected!

Good job, React team — thanks for saving us the trouble of debugging this! But this safe implementation has its limitations.

## useMemo pitfalls

While a great default, the locality and single-value limit of `useMemo` make it useless in some scenarios. For example, consider this attempt at memoizing a large city list:

```jsx
const RouteItem = () => { 
  const cities = useMemo(() => [{ 
    label: 'Moscow', value: 'MOW' 
  }, { 
    label: 'Saint Petersburg', value: 'LED' 
  }, // 1000 more cities], []); 
  return <select> 
    {cities.map(c => 
      <option value={c.value}>{c.label}</option>
    )} 
  </select>;
};
```

If we render a 1000 `RouteItem`s, each one gets its own array, which is wasteful. In this case, we’d prefer sharing the cache between different instances.

Another problem point is alternating dependency values. Let’s say we want to generate color scheme based on checkbox value:

```jsx
const SchemePicker = (props) => { 
  const [isDark, setDark] = useState(false); 
  const colors = useMemo(() => ({ 
    background: isDark ? 'black' : 'white', 
    color: isDark ? 'white' : 'black', 
  }), [isDark]); 
  return <div style={colors} {...props}> 
    <button onChange={() => setDark(!isDark)}> 
      toggle theme 
    </button> 
    {props.children} 
  </div>;
};
```

Here, we only have two possible dependency values, `true` and `false`, so there is no risk of a memory leak. Yet, on every checkbox change, we compute a fresh color scheme. The old one would be just fine, thank you.

So, in some cases we’d like to:

1. Share cache between different component instances.
2. Remember several values, not just the last one.

No problem, with the power of JS at our disposal we can make it happen.

## Global memo

If we want to reuse a value between component instances, no hook can save us, because both `useState` and `useRef` are local to component instance. But we can extract the cache into module scope, and work from there:

```jsx
// this is shared between all components
const cache = /* some cache */;
const Component = () => { 
  // cache is always the same object 
  const value = cache.get(deps);
}
```

### Precomputed global constant

The simplest kind of “cache” is one with no dependencies — a constant that’s usable in every component. And the simplest solution is to just to declare this constant right away:

```jsx
const cities = [
  { label: 'Moscow', value: 'MOW' }, 
  { label: 'Saint Petersburg', value: 'LED' }, 
  // 1000 more cities
];
// yay, every RouteItem refers to the same cities
const RouteItem = () => { 
  return <select> 
    {cities.map(c => 
      <option value={c.value}>{c.label}</option>
    )} 
  </select>;
};
```

Having just _one_ value for all components seems limiting. But, if we know all the possible dependency values in advance, we can just precompute the value for each dependency:

```jsx
const schemes = { 
  dark: { background: 'black', color: 'white' }, 
  light: { background: 'white', color: 'black' },
};
const SchemePicker = (props) => { 
  const [isDark, setDark] = useState(false); 
  // we only have 2 values, each one is stable 
  const colors = schemes[isDark ? 'dark' : 'light']; 
  return <div style={colors} {...props}> 
    <button onChange={() => setDark(!isDark)}> 
      toggle theme 
    </button> 
    {props.children} 
  </div>;
};
```

However, this technique comes with some drawbacks. Building the object in the initial execution phase delays the first paint, even if you don’t need the value right away. All the data needed to construct the value must be available when the script is initially executed. If any of this is a concern, let’s move on to the next technique!

### Lazy global constant

So, we want to share a single value between all components, but we want to compute it only when we need it. Fine, it’s a well-known pattern:

```jsx
let citiesCache;
// getCities intercepts accessing cities
const getCities = () => { 
  // use cached value if it exists 
  if (citiesCache) { 
    return citiesCache; 
  } 
  // otherwise put the array into the cache 
  citiesCache = [
    { label: 'Moscow', value: 'MOW' }, 
    { label: 'Saint Petersburg', value: 'LED' }, 
    // 1000 more cities
  ]; 
  return citiesCache;
};
const RouteItem = () => { 
  return <select> 
    {getCities().map(c => 
      <option value={c.value}>{c.label}</option>
    )}
  </select>;
};
```

Here, we delay building the value until we actually need it. Great! And we could even pass some data from an API to the builder, as long as it never changes. Fun fact: storing data in a state manager or an API cache is actually an example of this technique.

But what if we try to generalize this method for multiple values, just like we did with a precomputed map? Oh, that’s a whole different story!

### True memo

Let’s up our game by letting every component get a special version of city list, with one city excluded. We’d still like to share the cache between several instances, just in case. It’s not that hard:

```jsx
const cities = [
  { label: 'Moscow', value: 'MOW' }, 
  { label: 'Saint Petersburg', value: 'LED' }, 
  // 1000 more cities
];
const filterCache = {};
const getCitiesExcept = (exclude) => { 
  // use cached value if it exists 
  if (filterCache[exclude]) { 
    return filterCache[exclude]; 
  } 
  // otherwise put the filtered array into the cache
  filterCache[exclude] = cities
    .filter(c => c.value !== exclude); 
  return filterCache[exclude];
};
const RouteItem = ({ value }) => { 
  return <select> 
    {getCitiesExcept(value) 
      .map(c => <option value={c.value}>{c.label}</option>)}
  </select>;
};
```

This works, but global caches are vulnerable to infinite growth problem. In a long-lived app, you might eventually get to the point where every possible city was excluded, leaving you with a 1000 copies of your 1000-item array in the cache, most of them useless. To protect against this, we need some way to limit the cache size.

### LRU cache

To restrict cache size, we need some way to choose exactly which elements to “forget”. This is called [_cache replacement policy,_](https://en.wikipedia.org/wiki/Cache_replacement_policies) and there are surprisingly many approaches.

We’ll stick to the simplest method — least-recently used, or LRU cache. We only remember N last values. For example, after passing numbers 1, 2, 3, 1 to an LRU cache of size 2, we only store the values for 3 and 1, while the value for 2 was thrown away. The implementation is not interesting, hope you believe this is doable (see [flru](https://github.com/lukeed/flru/blob/master/src/index.js) for details). It’s worth noting that the original `useMemo` is actually an LRU cache of size 1, because it only stores one last value.

While it sounds good on paper, global bounded cache does not actually work that well for our use cases. To see why, let’s consider a cache of size 1. If we have several component instances alive at once, they _likely_ have different dependency values. If they render in alternating order, every instance encounters the value from the previously rendered one, which is a cache miss, and has to recompute. So, we end up recomputing on every render, and doing some useless comparisons.

More generally, a cache of size N is likely to have misses once N+1 components with different values are alive, and become useless at 2N components. This is not a good quality — a cache shouldn’t care how many consumers exist. We could experiment with other replacement policies — say, frequency-based caches — but they’re way harder to implement, and I feel like React apps don’t have cache usage patterns that could benefit from them.

There is, however, one case where it works: if you have N possible dependency values, and N is _small_ — say, `true` / `false`, or a number 1..10, a cache of size N has you fully covered with 100% cache hits, and only computes values when needed. But if that’s the case, a simple global cache works just the same, without the overhead of tracking usage order.

* * *

Recap time! We’ve started out by looking at `useMemo` in detail. `useMemo` cache is never shared between component instances, lives as long as the instance lives, and only stores one last value. There are good reasons for these decisions.

However, this makes `useMemo` not usable in some cases:

1. When you _want_ to reuse a value between components (e.g. always the same large object)
2. When your dependency quickly alternates between several values (e.g. true / false / true etc.)

Then, we examined 4 (4-and-a-half? 5?) caching techniques with a globally shared cache that overcome these issues:

1. Just use a module constant. Simple, reliable, but builds the object during initial script execution — suboptimal if the object is heavy and not needed during initial render.
2. Precomputed map — a simple extension of _module constant_ that stores several values. Same drawbacks.
3. Lazy constant — delay building the object until it’s needed, then cache forever. Removes module constant init delay during script init time.
4. Full memo — saves _all_ the results of function calls with _all_ arguments. Leaks memory when there are many possible dependency values / combinations. Good when there are few possible inputs. Use with care.
5. Bounded cache (e.g. LRU). Fixes the memory leak problem, but useless when the number of components alive with different deps is larger than cache size. Not recommended.

Here’s a cheat sheet to help you remember these techniques:

![](https://blog.thoughtspile.tech/images/global-memo-cheatsheet.png)

These techniques are useful in regular react apps, and can up your performance. But we don’t always need our cache to be shared between component instances. Luckily, all these methods also work when scoped to a component — stay tuned for the next post on alternate `useMemo` implementations.
