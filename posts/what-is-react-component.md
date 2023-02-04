---
title: What is a react component, anyways?
date: 2022-01-25
tags:
  - javascript
  - react
---

I used to teach a class on React. There’s no better way to start a hands-on course than “Let’s write a simple component!”. But time after time I hear — “Vladimir, what’s a component, anyways?”. Bah, what a question! It’s a react thingie. React apps are made of components. Why do you care at all? When you grow up you’ll see. But at some point in life you just have to find the definitive answer to this question, and for me this time is now.

![](https://blog.thoughtspile.tech/images/hat-soup.png?invert)

Here’s what we know so far. `Card` here is most certainly a component:

```
const Card = (props) => <div className="Card" {...props} />;const Page = () => { return <Card>hello</Card>;};
```

However, I have a strong sense that `renderCard` _is not:_

```
const renderCard = (props) => <div className="Card" {...props} />;const Page = () => { return renderCard({ children: 'hello' });};
```

But why is that? React [docs on components](https://reactjs.org/docs/components-and-props.html) are not very helpful — first they say a component is a piece of UI, then that “components are like functions that return JSX”, yet neither explains why `renderCard` is not a component. If we can solve this paradox, we can also find out what a react component actually is. We’ll examine 4 versions: is React component a…

- piece of UI?
- software decomposition unit?
- thing that implements some interface?
- unit of update?

And, surprise, it’s a bit of all four, really. Let’s dive in!

> Before we begin: “React component is a web component” is so false it does not deserve a section in my article. React components [do not implement](https://reactjs.org/docs/web-components.html) anything from the [Web Components spec.](https://developer.mozilla.org/en-US/docs/Web/Web_Components)

## Piece of UI

The most intuitive answer for anyone with front-end experience (both developers _and_ designers) is that React component is a reusable piece of UI. You look at figma designs, spot recurring fragments, and these are your React components:

![](https://blog.thoughtspile.tech/images/cmp-decomposition.png?invert)

It’s tempting to say that React components implement the concept of UI components. It’s a good first attempt at definition. Still, it leaves some questions unanswered. Our `renderCard` function is a reusable piece of UI, so it must be a component. This feels wrong. Next, React allows for components that don’t actually own any UI — most [higher-order components](https://reactjs.org/docs/higher-order-components.html) and some [libraries](https://github.com/downshift-js/downshift) work that way:

```
// Not a single UI element!const List = (props) => { const [items, setItems] = useState([]); const add = () => setItems([...items, items.length]); return ( <> {items.map(props.renderItem)} {props.renderAdd({ add })} </> );}
```

So, UI components and React components are different, even if mostly overlapping, concepts. Still, if you know your way around general UI component decomposition, you’ll mostly do fine in React. But to capture the true essence of React components, we must dig further.

## The architecture answer

As an [architecture cosmonaut,](https://www.joelonsoftware.com/2001/04/21/dont-let-architecture-astronauts-scare-you/) I must now bring up [component-based development.](https://en.wikipedia.org/wiki/Component-based_software_engineering#Software_component) It’s just a formalization of my “react thingie” answer, defining a _component_ as as _encapsulated set of related functions and data._

This is not useless — in a react app, components are similar to _classes_ in object-oriented programming and _functions_ in functional / procedural programming. Your codebase would benefit from applying design principles developed for other techniques, like SOLID — you needn’t throw all the previous best practices away and reinvent them as “react insights”. Component decomposition is your primary tool for managing[coupling](https://en.wikipedia.org/wiki/Coupling_(computer_programming)) / [god object](https://en.wikipedia.org/wiki/God_object) issues.

Still, as an overly abstract definition, this includes a lot of things that are _not_ react components. Your average React app consists of multiple layers — React view, state manager, API wrapper — and only one of these uses React components. _Hooks_ fit the definition by encapsulating data & functions, yet they’re most certainly _not_ components. `renderCard` is a nuisance. Next one!

## API contract interface

For the most boring take, let’s see what React itself considers a component, by looking at [@types/react](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/v16/index.d.ts) and the [react-dom implementation.](https://github.com/facebook/react/blob/13036bfbc8ecbcf4451adb7bde397f438caa8607/packages/react-dom/src/server/ReactPartialRenderer.js) Actually, many things work:

1. A function component that accepts props object and returns JSX: `(props: P) => ReactElement | null`
2. An object returned from `React.memo`, `forwardRef`, `Context` and some other builtins. They are called [exotic components](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/v16/index.d.ts#L351) and trigger [special renderer behavior.](https://github.com/facebook/react/blob/13036bfbc8ecbcf4451adb7bde397f438caa8607/packages/react-dom/src/server/ReactPartialRenderer.js#L1161)
3. A class that `extends React.Component`. Fun fact: since JS classes are functions under the hood, [React checks](https://overreacted.io/how-does-react-tell-a-class-from-a-function/) `prototype.isReactClass` (see [react-dom](https://github.com/facebook/react/blob/13036bfbc8ecbcf4451adb7bde397f438caa8607/packages/react-dom/src/server/ReactPartialRenderer.js#L286)) [defined](https://github.com/facebook/react/blob/main/packages/react/src/ReactBaseClasses.js#L28) on `Component` to distinguish classes from functions. This means that technically you can implement a class component without extending `Component`, which is probably a horrible idea.
4. _Module pattern components_ — functions returning component-like objects, as in `Card = () => ({ render: () => <div /> })`. Their [deprecation notice](https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md#deprecate-module-pattern-components) was probably the first time anyone learnt these existed.
5. _Maybe_ a string, as in `<div /> -> jsx('div')`. According to [react types](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/v16/index.d.ts#L69) it’s an `ElementType`, not a `ComponentType`, but I’ve also heard them referred to as “host components”. I frankly don’t care if we call these components, because there’s not much choice about using them anyways.

This peek inside the implementation answers at least one of our questions: _higher-order component_ is a misnomer. If a higher-order function is a function that operates on other functions, HOC should be a _component_ that accepts other components as props or returns a component. But the HOC itself is _not_ a component, because it’s a function that does not return vDOM. _Component factory_ would be a more fitting term. What’s done is done, though.

But what about `Card` vs `renderCard`? Both are functions that accept an object argument and return a react element, so both should be components. We could duct-tape our definition to force every component to be used properly — as a JSX `<tag>`, or directly passed to a JSX runtime (`jsx(s) / createElement`). But this means that nothing can _intrinsically_ be a component. Try a thought experiment: if I serve soup in a hat, the hat does not stop being a hat, it’s just me acting weird — why then would misusing a react component prevent it from being a component?

If the “software component” answer was too abstract, this one is too concrete. We have a list of requirements any React component must satisfy, but, as seen in `renderCard`, checking these boxes does not automatically make you a component. Moreover, this definition is very unstable — a change to react core (say, supporting Vue-like [single-file components](https://v3.vuejs.org/guide/single-file-component.html)) can easily invalidate it. Let’s try to find some deeper meaning in react components.

## Unit of update

This brings us to the answer I find most insightful: react component is a unit of update in a react app. _Only_ components can schedule an update by calling `useState / useReducer` update handle, doing `this.setState`, or subscribing to context changes. And updating state always re-renders (calls the render function and generates virtual DOM for) whole components. Whether a component uses this ability is irrelevant, only the fact that it _can_ matters.

For example, this component…

```
const Toggler = () => { const [state, setState] = useState(false); console.log('render'); return <button onClick={() => setState(!state)}>{String(state)}</button>;};
```

… can schedule an update when clicked, and this update runs every single line of `Toggler` — calls `useState`, logs to console, and creates vDOM for `button`.

We can connect this definition with our “piece of UI” take. Not all UI is elements — sometimes, the crucial part is _behavior._ Behavior can be viewed as mapping actions to updates, and that’s exactly what a component with no markup does.

This definition relies on the deeper architecture of React and I don’t think it’s bound to change anytime soon. It has survived the introduction of hooks and concurrent features, and it can incorporate many more changes. It also sets React apart from other frameworks that apply updates on sub-component level, like [Angular](https://blog.lacolaco.net/2021/02/angular-ivy-library-compilation-design-in-depth-en/), [svelte](https://dev.to/zev/how-does-svelte-actually-work-part-1-j9m) or [solid.](https://www.solidjs.com/guides/comparison#react)

Components can also opt out of an update using `React.memo`, `PureComponent` or `shouldComponentUpdate`. You could argue that caching vDOM objects with e.g. `useMemo` [opts out of an update, too,](https://reactjs.org/docs/hooks-faq.html#how-to-memoize-calculations) but that’s not entirely the same, because you’re just providing a hint to the reconciler — all of the render function and the effects still run. More on this some other time.

This explains why hooks [can only be called as a part of a function component.](https://reactjs.org/docs/hooks-rules.html#only-call-hooks-from-react-functions) In functional react, hooks are _the_ way to schedule an update. You can’t use hooks outside a component, because there’s nothing to update. _Note:_ hooks inside other hooks are allowed because, as long as the outermost hook is inside a component, inner ones are inside that component as well.

Hooks themselves are _not_ components, because updating `useState` in a hook does not just update this particular hook, but the whole component that contains it. Also, a hook can not prevent a running update from happening.

### Component vs render-function

Now let’s finally tackle `Card` vs `renderCard` confusion using our newfound definition. So far, neither `Card` nor `renderCard` is trying to update itself.

```
const Card = (props) => <div className="Card" {...props} />;const renderCard = (props) => <div className="Card" {...props} />;const Page = () => { return <> <Card>I am cool</Card> {renderCard({ children: 'I am a function' })} </>;};
```

Let’s change that by adding state into each implementation to paint it red on click:

```
const [active, setActive] = useState(false);return <div className="Card" style={{ color: active ? 'red' : null }} onClick={() => setActive(!active)} {...props}/>;
```

I know, `useState` inside a _regular function_ like `renderCard` [is not allowed](https://reactjs.org/docs/hooks-rules.html) but remember that we’re yet unsure whether `renderCard` is a component. So, let’s run our code and [test updates in both implementations.](https://codesandbox.io/s/fragrant-platform-7596t?file=/src/App.js:600-617) Aha, we see the difference! When clicked, `Card` just updates itself, while calling `setActive` in `renderCard` leaks up into the _real_ component, `Page`, and there’s nothing we can do about it inside `renderCard`. `Card` is capable of independent updates, but updating `renderCard` only works because it happens inside another component. That’s why `Card` is a component, and `renderCard` is not. Phew!

* * *

We’ve tried 4 explanations of what a react component actually is. Complete or not, each one gives us new insights into creating better components:

1. React components are pieces of UI. Sensible UI decomposition is a great start for React component structure. But not all React components own some UI elements.
2. React components are decomposition units of React apps. Applying SOLID or other API design principles to react components is a good practice. But not every single unit of a React app is a component.
3. React components implement some interface, and React runtime abstracts the different implementations (function / class component / `memo` & co) away. But why then is `{renderCard()}` not a component?
4. React components are a unit of update — they a) can update themselves b) always run render function completely and c) can opt out of a pending update.

I’m pretty satisfied with this last answer — it’s React-specific, but describes the _intended behavior_ instead of _implementation._ It also gives a good reason to prefer smaller components: they’ll update faster, and less frequently. See my post on [optimizing context](https://blog.thoughtspile.tech/2021/10/04/react-context-dangers/?twitter) for a concrete example.
