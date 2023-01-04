---
title: How to timeout a promise
tags:
  - promises
  - javascript
  - programming
date: 2021-04-02 21:18:51
---


Timeouts are one of the key building blocks to make your app stable. In short, if you send a request to an endpoint and a response does not, for whatever reason, come soon, we act as if the request failed and fall back to plan B — try again, show an error message and let the user decide what to do next, or use cached data. This is a great remedy for all kinds of flaky-web trouble: slow networks, clogged backends, overloaded databases — your user will never have to watch a spinner forever.

Fetch API has a <a href="https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal" target="_blank">signal</a> option to abort the request, but I wondered if it could be done using promises only. So, starting with a simple fetch, let's see if we can fit a timeout in there:

```js
const load = fetch('/api').then(res => res.json());
```

I bet we can, and let me show you how! First things first, we need to pull a callback-based JS timeout into the promise world. Here's how we do it:

```js
new Promise((ok) => {
    setTimeout(ok, 5000);
});
```

Pretty basic stuff, and very useful. We use the promise constructor to set the timeout that resolves the promise created after 5 seconds.

The next bit we need is `Promise.race`, the little brother of the famous `Promise.all` that is useful for about one real world thing, so no one really cares about it. Quoting <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race" target="_blank">MDN,</a> _Promise.race() returns a promise that fulfills or rejects as soon as one of the promises in an iterable fulfills or rejects, with the value or reason from that promise._ That's exactly what we need!

- If load promise resolves before timeout — we're good to go.
- If load promise rejects — fall back to plan B.
- If the timeout fires first — fall back to plan B, just as if loading failed.

Putting it all together and tweaking our timeout-promise to make it _reject_ (we're _bad,_ not _good,_ if we hit it) gives us this wonderful snippet:

```js
const load = Promise.race([
    fetch('/api').then(res => res.json()),
    new Promise((_, fail) => setTimeout(() => fail(new Error('Timeout')), 5000))
]).then(
    (res) => { /* process as you wish */ },
    (err) => { /* retry or display error */ });
```

What's even better, this technique, unlike `AbortSignal`, works not only for `fetch`, but for any promise-based operation: just replace `fetch` call above with `yourApiLayer.load()`, `DBQuery.execute()`, `serviceMesh.callRPC()` or whatever async stuff you want to timeout, and you're good to go.
