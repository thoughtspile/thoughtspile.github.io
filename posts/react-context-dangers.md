---
title: How to destroy your app performance using React contexts
tags:
  - react
  - programming
  - frontend
  - hooks
date: 2021-10-04 14:20:49
---

`useContext` hook has made React Context API so pleasant to work with that many people are even [suggesting](https://www.sitepoint.com/replace-redux-react-hooks-context-api/) that we drop external state management solutions and rely on the built-in _alternative_ instead. This is dangerous thinking that can easily push your app's performance down the drain if you're not careful. In this article, I explore the perils of using contexts, and provide several tips to help you optimize context usage. Let's go!

![](/images/die-redux.png)

## Context change re-renders every consumer

We're building a library of react components, and sometimes the design depends on viewport size. Most of the time breakpoint status (mobile / desktop) is enough, but in some cases we need the exact pixel size. We store that data in a context:

```js
const AdaptivityContext = useContext({});
export const AdaptivityProvider = (props) => {
    const [width, setWidth] = useState(window.innerWidth);
    useLayoutEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const adaptivity = {
        width,
        isMobile: width <= 680,
    };

    return <AdaptivityContext.Provider value={adaptivity}>
        {props.children}
    </AdaptivityContext.Provider>;
};
```

Life's good: instead of wrangling with `window.innerWidth` and global event listeners in every component, we can just read the context and get automatic updates. Here's for a single-breakpoint design:

```jsx
const InfoBar = ({ text, info }) => {
    const { isMobile } = useContext(AdaptivityContext);
    return <div>
        {text}
        {isMobile ? <i title={info} /> : <small>{info}</small>}
    </div>;
};
```

And here's for pixel-width:

```jsx
const FullWidth = (props) => {
    const { width } = useContext(AdaptivityContext);
    return <div style={{ position: 'fixed', left: 0, width }} {...props} />;
};
```

But there's a catch. If we resize the window a little bit without crossing the 620px breakpoint, both components will re-render, since `useContext` subscribes to context value changes, and doesn't care that you use only a part of that value that didn't change (`isMobile`). Of course, `InfoBar` does not actually depend on `width`, and React will not touch the DOM, but I'd still much prefer not trying to re-render it at all.

### Rule 1: make smaller contexts

In this case, the fix is fairly easy. We can split the original `AdaptivityContext` into two parts, so that every component can explicitly state if it depends on `width` or the breakpoint:

```js
const SizeContext = useContext({});
const MobileContext = useContext({});
export const AdaptivityProvider = (props) => {
    const [width, setWidth] = useState(window.innerWidth);
    useLayoutEffect(() => {
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);
    const isMobile = width <= 680;

    return (
        <SizeContext.Provider value={{ width }}>
            <MobileContext.Provider value={{ isMobile }}>
                {props.children}
            </MobileContext.Provider>
        </SizeContext.Provider>
    );
};
```

Now we can `{ width } = useContext(SizeContext)`, `{ isMobile } = useContext(MobileContext)`, or even both. The code is a little more verbose, but the change is worth it: if a component relies on `MobileContext`, it does not re-render on `width` change. Or does it? My bad:

- We create a new context-value object on every render
- `setWidth` triggers a re-render
- Therefore, `setWidth` creates new MobileContext value
- Since `MobileContext` value changed by reference, every `MobileContext` consumer re-renders.

We need a fix.

### Rule 2: stabilize context values

Context tracks value, object or not, using simple equality. This means that we have to stabilize object reference ourselves:

```js
const sizeContext = useMemo(() => ({ width }), [width]);
const mobileContext = useMemo(() => ({ isMobile }), [isMobile]);

return (
    <SizeContext.Provider value={sizeContext}>
        <MobileContext.Provider value={mobileContext}>
            {props.children}
        </MobileContext.Provider>
    </SizeContext.Provider>
);
```

If listing dependencies feels boring, try `useObjectMemo` hook I proposed in an [earlier post](https://thoughtspile.github.io/2021/04/05/useref-usememo/). Now, finally, the components that depend on `isMobile` only will not re-render on every width change.

### Rule 2, option b: Maybe use atomic context values

Making context value an atomic type, not an object, may seem smart:

```jsx
// ha, atomic types are compared by value
<SizeContext.Provider value={width}>
```

But what happens if we want to pass height? Changing SizeContext type to an object requires you to rewrite every `width = useContext(SizeContext)` to accept objects instead. Unpleasant, and impossible if `SizeContext` is your public API.

We can create a new `HeightContext`, but this quickly escalates into __context hell__ with very little reward, since width and height tend to change together and you won't avoid many re-renders by observing only one of them.

I'd only use atomic types for context values if I'm absolutely sure there are no values with similar change patterns and use cases that I might want to pass along later.

## Rule 3: Make smaller context consumers

On a side note, you can have a huge component that only has a few parts that depend on context. Re-rendering this component is hard even though the DOM change itself is small. Maybe something like a modal that only closes via gestures on mobile, but has a special close button on desktop:

```jsx
const Modal = ({ children, onClose }) => {
    const { isMobile } = useContext(MobileContext);
    // a lot of modal logic with timeouts, effects and stuff
    return (<div className="Modal">
        {/* a lot of modal layout */}
        {!isMobile && <div className="Modal__close" onClick={onClose} />}
    </div>);
}
```

Here, you could move the context usage to a separate component and re-render just the close icon on resize:

```jsx
const ModalClose = () => {
    const { isMobile } = useContext(MobileContext);
    return isMobile ? null : <div className="Modal__close" onClick={onClose} />;
};
const Modal = ({ children, onClose }) => {
    // a lot of modal logic with timeouts, effects and stuff
    return (<div className="Modal">
        {/* a lot of modal layout */}
        <ModalClose />
    </div>);
}
```

Or you can use `Context.Consumer` without creating an extra component:

```jsx
const Modal = ({ children, onClose }) => {
    // a lot of modal logic with timeouts, effects and stuff
    return (<div className="Modal">
        {/* a lot of modal layout */}
        <MobileContext.Consumer>
            {({ isMobile }) =>
                isMobile ? null : <div className="Modal__close" onClick={onClose} />}
        </MobileContext.Consumer>
    </div>);
}
```

## Collection context

A single-object context with pre-defined keys can be easily split into several parts. Sadly, this does not work for a _collection context_ — when you have many dynamic items, and the consumer only depends on one of them. Let's kick off our second example with a smart form controller:

```jsx
const FormState = createContext({ value: {}, setValue: () => {} });
const Form = (props) => {
    // collection of form item values
    const [value, setValue] = useState({});
    // basic submit handler
    const handleSubmit = (e) => {
        e.preventDefault();
        props.onSubmit(value);
    };
    // stabilize the context object
    const contextValue = useMemo(() => ({
        value,
        setValue
    }), [value]);
    return (
        <FormState.Provider value={contextValue}>
            <form {...props} onSubmit={handleSubmit} />
        </FormState.Provider>
    );
};
// only exposes a single item by name
const useFormState = (name) => {
    const { value, setValue } = useContext(FormState);
    const onChange = useCallback(() => {
        setValue(v => ({ ...v, [props.name]: e.target.value }));
    }, [props.name]);
    return [value[name], onChange];
};
const FormInput = (props) => {
    const [value, onChange] = useFormState(name);
    return <input value={value} onChange={onChange} {...props} />;
};
```

Looks neat! We can now put any markup in `<Form>`, and then bind to the form value using `<FormItem>`:

```jsx
<Form>
    <FormInput name="phone" />
    <FormInput name="email" />
    <fieldset>
        <FormInput name="firstName" />
        <FormInput name="lastName" />
    </fieldset>
    <FormInput type="submit">submit</FormInput>
</Form>
```

Watch closely! `FormState` context changes on every form item change. `FormInput` uses the full `FormState` context. This means that every `FormItem` re-renders on every form item change, even though it only depends on `value[name]`. This time we can't give every form item an individual context, since the items can be highly dynamic. There's no easy fix this time, but let's see what we can do.

> Disclaimer: our incredible form has seven HTML elements, and updating the is a breeze for react. Please play along and pretend that `FormInput` is an incredibly tweakable synthetic field with icons and dropdowns, and we have 100 items in a form.

### Tip: consider a HOC

We can't prevent `useContext` from running the whole render function on every context change. What we can do instead is make the render function lighter and leverage `memo` to tell React not to re-render. It's similar to what we did the modal example, but the context-dependent part is the wrapper now, not the child. If you still remember, this pattern is called container / presentation (aka smart / dumb) components:

```jsx
const FormItemDumb = memo((props) => <input {...props} />);
const FormItem = (props) => {
    const [value, onChange] = useFormState(props.name);
    return <FormItemDumb {...props} value={value} onChange={onChange} />;
};
```

We still run the whole `FormItem` render on every context change, but now the _render_ is just the `useContext` call. From there, `FormItemDumb` will see if the change was relevant, and skip re-rendering if it wasn't. Much better! Just for kicks, let's try again, with a higher-order component:

```js
const FormItemDumb = (props) => <input {...props} />;
const withFormState = Wrapped => {
    const PureWrapped = memo(Wrapped);
    return (props) => {
        const [value, onChange] = useFormState(props.name);
        return <PureWrapped {...props} value={value} onChange={onChange} />;
    };
};
const FormItem = withFormState(FormItemDumb);
```

`withFormState` can wrap any component, not only `input`, and gives us the same flexibility as `useFormState` hook, but without the extra re-renders.

## How the big guys do it

People who write state management libraries, could benefit from context the most, and know the inner workings of react much better than you or me. Let's see how they approach these problems.

`mobx` API for binding components is `observer(Component)`, which might lead you to believe it uses our HOC method, but it [actually doesn't](https://github.com/mobxjs/mobx/blob/main/packages/mobx-react-lite/src/observer.ts). Instead, it calls your component as a function, and then uses mobx dependency detection. No contexts involved at all — makes sense, since we didn't have a provider in the first place. But, fine, mobx is an oddball.

Redux seems to do things the react way, and `react-redux` [does use](https://react-redux.js.org/introduction/getting-started) a `Provider` — maybe it knows a way to optimize context usage? Nope, `useSelector` subscribes to the store [via a custom subscription](https://github.com/reduxjs/react-redux/blob/master/src/hooks/useSelector.ts) runs custom shallow comparison and only triggers a render if the selected fragment has changed. The context just injects the store instance.

OK, redux and mobx are mature libraries that don't pretend to be super tiny. Maybe newer state managers have fresh ideas. Zustand? [Custom subscription.](https://github.com/pmndrs/zustand/blob/main/src/index.ts) Unistore? [Custom subscription.](https://github.com/developit/unistore/blob/master/src/integrations/react.js) Unstated? [Raw context for hooks version,](https://github.com/jamiebuilds/unstated-next/blob/master/src/unstated-next.tsx) but it's 200 bytes and it works.

So, none of the major state managers rely on the context API — not even those that could. They avoid the performance problems by using custom subscriptions and only updating if the _relevant_ state has changed.

## The react future

React core team is, of course, aware of this shortcoming — [this issue](https://github.com/facebook/react/issues/14110) is an interesting read. Context API even had a weird [observedBits feature,](https://hph.is/coding/bitmasks-react-context) but it's [gone now.](https://github.com/facebook/react/pull/20953)

The way forward appears to be _context selectors_ — used like `useContext(Context, c => c[props.id])`. An [RFC](https://github.com/reactjs/rfcs/pull/119) has been open since 2019, and an [experimental PR implementing it](https://github.com/facebook/react/pull/20646) is in the works. Still, this feature is not coming in [react 18](https://github.com/reactwg/react-18/discussions/73). In the meantime, Daishi Kato has made two cool libraries: [use-context-selector](https://github.com/dai-shi/use-context-selector), that implements the RFC, and a proxy-based [react-tracked](https://github.com/dai-shi/react-tracked), to eliminate the wasted renders.

---

`Context` API is a nice feature, but, since _every_ context update always re-renders _every_ consumer of this context, may cause performance problems if not used carefully. To mitigate this:

- Move context values with different change patterns into separate contexts.
- Always stabilize context value object reference or use atomic types.
- Make components that use context as small as possible, so that their re-renders are fast.
- Split a component into a HOC-like wrapper with `useContext`, and a simple renderer wrapped in `memo()`
- Look into [dai-shi's amazing useContext wrappers.](https://github.com/dai-shi)
- Context is not suitable for complex state management. Try using a real state manager.

As usual, have fun, make good apps, don't ride the hype train. If you like what I have to say about React, see if [setState has some features you don't know](https://thoughtspile.github.io/2021/09/27/usestate-tricks/) (a big hit!) or [why you shouldn't setState in useLayoutEffect](https://thoughtspile.github.io/2021/09/21/useeffect-derived-state/).
