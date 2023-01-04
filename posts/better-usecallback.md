---
title: Did I just build a better useCallback?
date: 2021-04-07 21:07:46
tags:
    - react
    - programming
    - frontend
    - hooks
---


> Edit: the technique initially proposed in this post was not concurrent-mode safe. I've added a new section describing a fix to this problem. Thanks to the readers who noticed it!

`useCallback` has always been one of my least favorite hooks:
- it does not provide much value over `useMemo` (as we learnt in my previous post on hooks),
- it weirdly treats function as _derived data,_ recreating it on dependency changes, a pattern I haven't seen anywhere else
- it requires you to list the variables you reference within a closure, which is boring and flaky, and relies on imperfect static analysis to enforce this.

Luckily, we can build a better `useCallback` ourselves using nothing but `useRef` and our JS ninja skills.

## A working example

```jsx
function FormItem({ name, value, onChange, ...props }) {
    const onChange = useCallback(e => {
        onChange({ ...value, [name]: e.target.value });
    }, [onChange, name, value]);
    return <HeavyInput onChange={onChange} value={value[name]} {...props} />;
};

function LoginForm() {
    const [formValue, setFormValue] = useState({
        username: '',
        password: '',
    });
    return (<>
        <FormItem name="password" value={formValue} onChange={setFormValue} />
        <FormItem name="username" value={formValue} onChange={setFormValue} />
    </>);
}
```

This example perfectly summarizes the downsides of `useCallback`. Not only did we duplicate all the props we used in a closure, but also consider what happens when we update the password field:
1. Password `HeavyInput` triggers `setFormValue({ password: '123', username: '' })`
2. `formValue` reference updates
3. _Both_ `FormItem`s re-render, which is fair enough
4. `onChange` in username `FormItem` updates, too, since value reference updated
5. `HeavyInput` in username `FormItem` re-renders, because `FormItem`'s `onChange` has a new reference

This may be OK with 2 fields, but what about a hundred? What about when your callback has so many dependencies something updates on every render? You might argue that the components should have been modeled some other way, but there is nothing conceptually wrong with this one that can't be fixed with a better `useCallback`.

## The classic solution

Back with class components we had no hooks, but changes in callback prop reference did trigger useless child component update, just as it does now (hence [`react/jsx-no-bind` eslint rule](https://github.com/yannickcr/eslint-plugin-react/blob/master/docs/rules/jsx-no-bind.md)). The solution was simple: you create a class method (or, lately, into a property initializer) to wrap all the `props` references you need, and pass this method as a prop instead of an arrow:

```jsx
class FormItem extends Component {
    onChange = (e) => this.props.onChange({ ...this.props.value, [this.props.name]: e.target.value });

    render() {
        return <HeavyInput onChange={this.onChange} />
    }
}
```

`onChange` method is created in constructor and has a stable reference throughout the lifetime of the class, yet accesses fresh props when called. What if we just applied this same technique, just without the class?

## The proposal

So, without further adue, let me show you an improved `useCallback`:

```jsx
const useStableCallback = (callback) => {
    const onChangeInner = useRef();
    onChangeInner.current = callback;
    const stable = useCallback((...args) => onChangeInner.current(...args), []);
    return stable;
};
```

Watch closely:
1. `onChangeInner` is a _box_ that always holds the fresh value of our `callback`, with all the scope it has.
2. Old `callback` is thrown away on each render, so I'm pretty sure it does not leak.
3. `stable` is a callback that never changes and only references `onChangeInner`, which is a stable _box_.

Now we can just swap `useCallback` for `useStableCallback` in our working example. The dependency array, `[onChange, name, value]`, can be safely removed — we don't need it any more. The unnecessary re-renders of `HeavyInput` magically disappear. Life is wonderful once again.

__There is one problem left: this breaks in concurrent mode!__

## Concurrent mode

While React's <a href="https://reactjs.org/docs/concurrent-mode-intro.html" target="_blank">concurrent mode</a> is still experimental and this code is completely safe when used outside it, it's good to be future-proff when you can. A concurrent-mode call to render function does not guarantee the DOM will update right away, so by changing the value of `onChangeInner.current` we're essentially making future `props` available to the currently mounted DOM, which may give you surprising and unpleasant bugs.

Following in the footsteps of an exciting <a href="https://github.com/facebook/react/issues/14099#issuecomment-440013892" target="_blank">github issue in react repo,</a> we can fix this:

```jsx
const useStableCallback = (callback) => {
    const onChangeInner = useRef(callback);
    // Added useLayoutEffect here
    useLayoutEffect(() => {
        onChangeInner.current = callback;
    });
    const stable = useCallback((...args) => onChangeInner.current(...args), []);
    return stable;
};
```

The only thing we've changed was wrapping the update of `onChangeInner` in a `useLayoutEffect`. This way, the callback will update _immediately after_ the DOM has been updated, fixing our problem. Also note that `useEffect` would not cut it — since it's not called right away, the user might get a shot at calling a stale callback.

One drawback of this solution is that now we can't use the function returned inside the render function since it has not been updated yet. Specifically:
```jsx
const logValue = useStableCallback(() => console.log(props.value));
// will log previous value
logValue();
return <button onClick={logValue}>What is the value?</button>
```
We don't need a stable function reference to call it during render, so that works for me.

## Wrapping up

When compared to React's default `useCallback`, our proposal with a totally stable output:
- Simplifies the code by removing explicit dependency listing.
- Eliminated useless updates of child components.
- Obtained a totally stable wrapper for callback props that can be used in `setTimeout` or as a native event listener.

At a cost of not being able to call it during render.  For me, this sounds like a fair deal.
