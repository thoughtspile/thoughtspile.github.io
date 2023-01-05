---
title: Two practical uses for capture event listeners
tags:
    - javascript
    - programming
    - frontend
date: 2021-06-07
---

Normally, JS event are handled while _bubbling_ up the DOM tree, and we've all had the pleasure to catch an event from a child node on its parent. You'd even be excused for thinking that's the only way DOM events move. Many also know there's something else — events start at the document root, then go down to the affected element in a phase called "capture", and only then "bubble" back up (not all do — more on this in a minute). See [MDN article on events](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#event_bubbling_and_capture) for more details on this mechanism.

I always saw this capture / bubble thing as a trick interview question similar to "what is the value of `i++ + ++i`", not something useful in normal life. Yet, I have found several good uses for this knowledge nugget, and now I want to pass it over to you.

## Observe non-bubbling events

It turns out that some events don't bubble at all. I first encountered this when working on a zoom-to-fit feature in Yandex.mail. When an image is loaded, the email DOM box size may change, and you need to resize it a bit more. But to do this, you need to know when an image loads, and `load` is one naughty event that does not bubble. The original code was therefore a wild mess of

```js
querySelectorAll('img').forEach(img => img.addEventListener('load', resize))
```

As far as I'm concerned, though, all events go through the `capture` phase with no exceptions, so I happily replaced it with

```jsx
<div onLoadCapture={resize}>{email}</div>
```

See this in action in a [sandbox](https://codesandbox.io/s/img-load-capture-382m0) I made.

I'm not sure the exact choice of non-bubbling events makes any sense. `load` and `error` do not bubble, so my first guess was "of course, it's an image that loads, not the `div` itself". However, [`input` event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event) bubbles, and by the same logic input happened in the input, not in the containing `div`. Your best bet is to consult the MDN.

## Selectively prevent events inside a container

Another practical use of `capture` is when you don't want the content of a container to respond to some user interactions. Capture handler on the container fires before any handlers on the content, so you get a chance to `stopPropagation`, and the listeners attached to the inner elements will never know something happened. I have used this on two occassions.

By coincidence, just today I used a capture listener to stop `click` event from firing on content during custom gesture detection. Touch devices nicely do it natively — if you happen to hit a button when scrolling a page, the button will not be clicked when you release a finger. We have a Gallery / Slider component that supports mouse drag, and firing `click` when switching slides might be unexpected. Fixed with a capture click listener.

Another case was making a react-based form readonly during synchronization with backend using `change` capture — see [sandbox.](https://codesandbox.io/s/react-prevent-change-gtdzu) I'll be the first one to admit this was not the cleanest approach, but when choosing between this and reimplementing all the form controls to support disabling via context for a one-off feature, I think I made the right call.

## How to attach a capture event handler

If you've ever messed with the trird argument of `addEventListener`, you know it comes with two signatures: the legacy `addEventListener(evt, cb, true)` where `true` is the boolean capture argument, and the more modern `addEventListener(evt, cb, { capture: true })` designed to support the other flag, `passive`. Contrary to the popular belief, if you just want `capture`, you don't need complicated feature detection — using the boolean parameter is fine and safe, since no backwards compatibility was ever broken here. So, to add a capture event listener using the DOM API:

```js
const onClick = e => console.log(e);
element.addEventListener('click', onClick, true);
// NOTE: removing a capture listener requires capture flag, too
element.removeEventListener('click', onClick, true);
```

In React, you just `<div onClickCapture={onClick}>` — all the events support this except `onMouseEnter / Leave`, because [React is trying to be smart](https://reactjs.org/docs/events.html#mouse-events). I'm no expert on other frameworks, but I'm hearing Vue has `<div v-on:click.capture="onClick">...</div>`, and Angular [can't](https://github.com/angular/angular/issues/11200) — don't despair and fall back to `addEventListener` instead.

---

And that's basically it — capture event listeners are useful for handling non-bubbling events (like image `load` / `error`) and for preventing certain events inside a container. There is an extra case I've used it in the past for — observing events when `.stopPropagation` is called by a third-party library, but it's super hacky and not recommended. Trying to find a common theme, capture events work well wherever you feel like grabbing some DOM nodes you don't own and slapping an event handler on them.
