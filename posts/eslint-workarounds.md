---
title: Go beyond eslint limits with these 3 tricks
date: 2021-06-04
tags:
    - eslint
    - infra
    - programming
    - javascript
---

My current obsession with statically checking JS code got me to appreciate eslint even more. Recently, I've shown you <a href="/2021/06/02/eslint-restrict-syntax" target="_blank">how to use `no-restricted-syntax`</a> to lint almost anything. Still, like any tool, eslint has its limits — often a precise rule bends eslint too much, and is not practical to support. For example, eslint can't look into another module. Some smart plugins (like [plugin-import](https://github.com/benmosher/eslint-plugin-import)) can work around that, but it's not something I'd be comfortable doing myself. Luckily, I know several tricks that let you bypass these limitations!

I'm currently building infrastructure to support mini-apps (microfrontends, plugins, call them whatever you want) — smaller front-end applications that run side-by-side in a single JS context. As you can guess, such apps need special restrictions not to collide with each other — CSS must be scoped, DOM `id`s are prohibited, and so on. Enforcing these restrictions with eslint was a breeze. Ensuring unique `localStorage` keys across all apps is trickier: even if we specify that the keys must follow `<appName>:<key>` convention, there's no clear way to lint it.

Forcing an explicit string prefix, as in `localStorage.setItem('settings:name')` prevents the users from extracting the keys to a common module, which is a good practice. Once the `localStorage` is accessed with a variable key, `localStorage.setItem(nameKey)`, all bets are off as you can't peek into the contents of `nameKey`. But here's what you can do instead.

## Facade API + banning the raw version

The most convenient choice in this case was to provide a wraper API, `appLocalStorage`, that would prefix all keys with `appName`, along the lines of

```js
export const appLocalStorage = {
    setItem(name) {
        return localStorage.setItem(`${appName}:${key}`);
    },
    // etc
}
```

Then we could ban the raw `localStorage` with a combination of [`no-restricted-globals`](https://eslint.org/docs/rules/no-restricted-globals) and [`no-restricted-properties`](https://eslint.org/docs/rules/no-restricted-properties) or even a `no-restricted-syntax: ['error', 'Identifier[name=localStorage]']`, forcing everyone to use the safe wrapper.

In other cases, however, the raw API is not easily bannable either — how to force all React components to use [`forwardRef`](https://reactjs.org/docs/forwarding-refs.html) if the raw component is just a function? Read on!

## Runime check

Another possibility to restrict some patterns is enforcing a runtime JS check that warns the developer if he does something wrong. Going on with our `localStorage` example, we could monkey-patch localStorage to give a warning whenever the key requested is not prefixed:

```js
const setItem = localStorage.setItem;
const prefix = `${appName}:`;
window.localStorage.setItem = (key, value) => {
    if (!key.startsWith(prefix)) {
        console.error(`localStorage: "${key}" must start with "${prefix}"`);
    }
    setItem(key, value);
}
```

This approach has a standard drawback of runtime checks — if the developer doesn't hit the code that fails when working on a feature, he'll never know he's done something wrong. With some client error monitoring in place, you could replace `console.error` with

```js
setTimeout(() => {
    throw new Error(`localStorage: "${key}" must start with "${prefix}"`);
}, 0);
```

The error is thrown asynchronously, so that the access does not explode. If _any_ user, or even your QA, hits the violation, the error message will be caught by your monitoring, and you'll have a chance to fix it sooner. Still not perfect, because there's a large gap between introducting the error and seeing it, but better than nothing.

If you're against modifying builtins, you can instead set up a periodic check:

```js
setInterval(() => {
    if (Object.keys(localStorage)).some(k => !k.startsWith(`${appName}:`)) {
        console.error('...');
        // throw new Error('...') works just as well
    }
}, 1000);
```

This method is best suited to new apps. Hopefully, when developing a feature you run it to see if it works, and get a helpful warning. Integrating this approach into an app that already has a lot of code potentially violating the rule requires you to manually check all the possibly affected scenarios, which is usually not fun. Hopefully, we can improve this a bit.

## Unit test-time checks

Runtime checks work, but rely on developer's luck (or QA testing a case that causes the error), and may report the error too late (worst case — in production). Unit tests are a great way to _make sure_ a certain piece of code is run during the CI process. A jest expectation for our localStorage case would be...

```js
const keys = Object.keys(localStorage);
expect(keys.every(k => k.startsWith(`${appName}:`))).toBeTrue();
```

And you can even put this into [`afterEach`](https://jestjs.io/docs/api#aftereachfn-timeout) / [`afterAll`](https://jestjs.io/docs/api#afterallfn-timeout) to automatically check for invalid keys after each test. From here, it's a matter of ensuring all `localStorage` uses are covered with tests — the ease of this task depends on your coverage thresholds. Not universally applicable, but a helpful technique nevertheless.

---

Today we've learnt three methods that overcome the limitations of eslint and effectively let you enforce _very_ complicated restrictions:

- Enforcing facade API (the most convenient method)
- Runtime check (works best for new apps)
- Extra check in unit tests (requires high coverage)

And this is probably all I can tell you about eslint.
