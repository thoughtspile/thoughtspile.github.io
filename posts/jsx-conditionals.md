---
title: Good advice on JSX conditionals
date: 2022-01-17
tags: 
  - programming
  - frontend
  - react
  - hooks
---


Conditional rendering is a cornerstone of any templating language. React / JSX bravely chose not to have a dedicated conditional syntax, like `ng-if="condition"`, [relying](https://reactjs.org/docs/conditional-rendering.html) on JS [boolean operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Logical_AND) instead:

- `condition && <JSX />` renders `<JSX />` iff `condition` is truthy,
- `condition ? <JsxTrue /> : <JsxFalse />` renders `<JsxTrue />` or `<JsxFalse />` depending on the truthiness of `condition`.

Courageous, but not always as intuitive as you’d expect. Time after time I shoot myself in the foot with JSX conditionals. In this article, I look at the trickier corners of JSX conditionals, and share some tips for staying safe:

1. Number `0` likes to leak into your markup.
2. Compound conditions with `||` can surprise you because precedence
3. Ternaries don’t scale.
4. `props.children` is not something to use as a condition
5. How to manage update vs remount in conditionals.

If you’re in a hurry, I’ve made a cheat sheet:

![](https://blog.thoughtspile.tech/images/jsx-conditional-cheatsheet.png)

## Beware of zero

Rendering on _numerical_ condition is a common use case. It’s helpful for rendering a collection only if it’s loaded and non-empty:

```jsx
{gallery.length && <Gallery slides={gallery}>}
```

However, if the gallery _is_ empty, we get an annoying `0` in out DOM instead of nothing. That’s because of the way `&&` works: a falsy left-hand side (like 0) is returned immediately. In JS, boolean operators do not cast their result to boolean — and for the better, since you don’t want the right-hand JSX to turn into `true`. React then proceeds to put that 0 into the DOM — unlike `false`, it’s a valid react node (again, for good — in `you have {count} tickets` rendering 0 is perfectly expected).

The fix? I have two. Cast the condition to boolean explicitly in any way you like. Now the expression value is `false`, not `0`, and `false` is not rendered:

```jsx
gallery.length > 0 && jsx
// or
!!gallery.length && jsx
// or
Boolean(gallery.length) && jsx
```

Alternatively, replace `&&` with a ternary to explicitly provide the falsy value — `null` works like a charm:

```jsx
{gallery.length ? <Gallery slides={gallery} /> : null}
```

## Mind the precedence

_And_ (`&&`) has a higher precedence than _or_ (`||`) — that’s how [boolean algebra](https://en.wikipedia.org/wiki/Boolean_algebra) works. However, this also means that you must be very careful with JSX conditions that contain `||`. Watch as I try to render an access error for anonymous _or_ restricted users…

```jsx
user.anonymous || user.restricted && <div className="error" />
```

… and I screw up! The code above is actually equivalent to:

```jsx
user.anonymous || (user.restricted && <div className="error" />)
```

Which is _not_ what I want. For anonymous users, you get `true || ...whatever...`, which is `true`, because JS _knows_ the or-expression is true just by looking at the left-hand side and skips ([short-circuits](https://stackoverflow.com/questions/12554578/does-javascript-have-short-circuit-evaluation)) the rest. React doesn’t render `true`, and even if it did, `true` is not the error message you expect.

As a rule of thumb, parenthesize the condition as soon as you see the OR:

```jsx
{(user.anonymous || user.restricted) && <div className="error" />}
```

For a more sneaky case, consider this ternary-inside-the-condition:

```jsx
{user.registered ? user.restricted : user.rateLimited && 
  <div className="error" />}
```

Parentheses still help, but avoiding ternaries in conditions is a better option — they’re very confusing, because you can’t even read the expression out in English (if the user is registered then if the user is restricted otherwise if the user is rate-limited, please make it stop).

## Don’t get stuck in ternaries

A ternary is a fine way to switch between _two_ pieces of JSX. Once you go beyond 2 items, the lack of an `else if ()` turns your logic into a bloody mess real quick:

```jsx
{isEmoji ? 
  <EmojiButton /> : 
  isCoupon ? 
    <CouponButton /> : 
    isLoaded && <ShareButton />}
```

Any extra conditions inside a ternary branch, be it a nested ternary or a simple `&&`, are a red flag. Sometimes, a series of `&&` blocks works better, at the expense of duplicating some conditions:

```jsx
{isEmoji && <EmojiButton />}
{isCoupon && <CouponButton />}
{!isEmoji && !isCoupon && isLoaded && <ShareButton />}
```

Other times, a good old `if / else` is the way to go. Sure, you can’t inline these in JSX, but you can always extract a function:

```jsx
const getButton = () => { 
  if (isEmoji) return <EmojiButton />; 
  if (isCoupon) return <CouponButton />; 
  return isLoaded ? <ShareButton /> : null;
};
```

## Don’t conditional on JSX

In case you’re wondering, react elements passed via props don’t work as a condition. Let me try wrapping the children in a div _only_ if there are children:

```jsx
const Wrap = (props) => { 
  if (!props.children) return null; 
  return <div>{props.children}</div>
};
```

I expect `Wrap` to render `null` when there is no content wrapped, but React doesn’t work like that:

- `props.children` can be an empty array, e.g. `<Wrap>{[].map(e => <div />)}</Wrap>`
- `children.length` fails, too: `children` can _also_ be a single element, not an array (`<Wrap><div /></Wrap>`).
- `React.Children.count(props.children)` [supports](https://reactjs.org/docs/react-api.html#reactchildrencount) both single and multiple children, but thinks that `<Wrap>{false && 'hi'}{false && 'there'}</Wrap>` contains 2 items, while in reality there are none.
- Next try: `React.Children.toArray(props.children)` [removes invalid nodes,](https://reactjs.org/docs/react-api.html#reactchildrentoarray) such as `false`. Sadly, you still get true for an empty fragment: `<Wrap><></><Wrap>`.
- For the final nail in this coffin, if we move the conditional rendering inside a component: `<Wrap><Div hide /></Wrap>` with `Div = (p) => p.hide ? null : <div />`, we can _never_ know if it’s empty during `Wrap` render, because react only renders the child `Div` after the parent, and a stateful child can re-render independently from its parent.

For the only sane way to change anything if the interpolated JSX is empty, see [CSS `:empty` pseudo-class.](https://developer.mozilla.org/en-US/docs/Web/CSS/:empty)

## Remount or update?

JSX written in separate ternary branches feels like completely independent code. Consider the following:

```jsx
{hasItem ? <Item id={1} /> : <Item id={2} />}
```

What happens when `hasItem` changes? Don’t know about you, but my guess would be that `<Item id={1} />` unmounts, then `<Item id={2} />` mounts, because I wrote 2 separate JSX tags. React, however, doesn’t know or care what I wrote, all it sees is the `Item` element in the same position, so it keeps the mounted instance, updating props (see [sandbox](https://codesandbox.io/s/still-cherry-o123c?file=/src/App.js)). The code above is equivalent to `<Item id={hasItem ? 1 : 2} />`.

> When the branches contain different components, as in `{hasItem ? <Item1 /> : <Item2 />}`, React remounts, because `Item1` can’t be updated to become `Item2`.

The case above just causes some unexpected behavior that’s fine as long as you properly manage updates, and even a bit more optimal than remounting. However, with uncontrolled inputs you’re in for a disaster:

```jsx
{mode === 'name' 
  ? <input placeholder="name" /> 
  : <input placeholder="phone" />}
```

Here, if you input something into _name_ input, then switch the mode, your name unexpectedly leaks into the _phone_ input. (again, see [sandbox](https://codesandbox.io/s/still-cherry-o123c?file=/src/App.js)) This can cause even more havoc with complex update mechanics relying on previous state.

One workaround here is using the `key` prop. Normally, we use it for [rendering lists,](https://reactjs.org/docs/lists-and-keys.html) but it’s actually an _element identity_ hint for React — elements with the same `key` are the same logical element.

```jsx
// remounts on change
{mode === 'name' 
  ? <input placeholder="name" key="name" /> 
  : <input placeholder="phone" key="phone" />}
```

Another option is replacing the ternary with two separate `&&` blocks. When `key` is absent, React falls back to the index of the item in `children` array, so putting distinct elements into distinct positions works just as well as an explicit key:

```jsx
{mode === 'name' && <input placeholder="name" />}
{mode !== 'name' && <input placeholder="phone" />}
```

Conversely, if you have _very different_ conditional props on the same logical element, you can split the branching into two separate JSX tags for readability with _no_ penalty:

```jsx
// messy
<Button 
  aria-busy={loading} 
  onClick={loading ? null : submit}
>
  {loading ? <Spinner /> : 'submit'}
</Button>
// maybe try:
loading 
  ? <Button aria-busy><Spinner /></Button> 
  : <Button onClick={submit}>submit</Button>
// or even
{loading && 
  <Button key="submit" aria-busy><Spinner /></Button>}
{!loading && 
  <Button key="submit" onClick={submit}>submit</Button>}
// ^^ bonus: _move_ the element around the markup, no remount
```

* * *

So, here are my top tips for using JSX conditionals like a boss:

- `{number && <JSX />}` renders `0` instead of nothing. Use `{number > 0 && <JSX />}` instead.
- Don’t forget the parentheses around or-conditions: `{(cond1 || cond2) && <JSX />}`
- Ternaries don’t scale beyond 2 branches — try an `&&` block per branch, or extract a function and use `if / else`.
- You can’t tell if `props.children` (or any interpolated element) actually contains some content — CSS `:empty` is your best bet.
- `{condition ? <Tag props1 /> : <Tag props2 />}` will _not_ remount `Tag` — use unique `key` or separate `&&` branches if you want the remount.
