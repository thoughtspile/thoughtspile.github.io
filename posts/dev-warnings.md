---
title: Build better libraries, use dev warnings
tags:
  - open source
  - programming
  - javascript
  - developer experience
date: 2021-09-22 18:43:11
---


Suppose you're making a cool library that sums numbers in an array. You add a new option, `inital`, that lets users specify an initial value for the summation:

```js
sum([1, 1, 1], { inital: 10 }) // 13
```

Oh no! You made a typo — of course you meant `initial`, not `inital`. What's done is done, and you're stuck with a million users relying on your `inital` option. Here's what you can do:

1. Keep the `inital` option forever. You bconfuse the users and become known as _that guy who can't spell._
2. Rename `inital` to `initial` immediately. Everyone has to rewrite their code that was working fine (thinking you're a jerk), and the apps whose authors don't follow the changelog explode.

As a responsible maintainer, you decide to go the third way — support both `initial` and `inital` for now, schedule dropping `inital` in v2, and let your users know a breaking change is coming. You fix the issue with this ingenious code:

```js
function sum(arr, ops = {}) {
    if ('inital' in ops) {
        console.log('dont use inital option');
    }
    const { initial = (ops.inital || 0) } = ops;
    return arr.reduce((s, a) => s + a, initial);
}
```

Not so fast! Here are some problems with this fix:

1. Production bundle size of your library has grown by 25% thanks to the bundled error messages.
2. The apps relying on `inital` option run slower, since `console.warn` is fairly heavy.
3. Dev console is all covered in your `inital` message, and it's easier to miss important warnings from other libraries.
4. If the dev uses a lot of libraries, it's not clear exactly what caused the error.

Let's handle these issues one by one.

## Remove warning from production

The first two issues can be fixed by removing the warning code from production bundle. Easier than it seems:

```js
if (process.env.NODE_ENV === 'development' && ('inital' in ops)) {
    console.log('dont use inital option');
}
```

Your user's bundler replaces `process.env.NODE_ENV` with a literal string, `"production"`, in production mode, turning the condition into `if ('production' === 'development')`, which is `if (false)`, and then the minifier's [dead code elimination](https://lihautan.com/dead-code-elimination/) removes the `if` block altogether, since it can never get executed. All the warning code, and even the `ops.inital` check, are gone. Pretty smart!

This works in [webpack](https://webpack.js.org/guides/production/#specify-the-mode), [parcel](https://parceljs.org/production.html#optimisations), and [rollup (with plugin-replace)](https://github.com/rollup/rollup/issues/487). Some of the biggest JS libraries, like [react](https://github.com/facebook/react/blob/cae635054e17a6f107a39d328649137b83f25972/packages/react/npm/index.js) and [vue,](https://github.com/vuejs/vue/search?q=node_env) use this technique, so you're in good company.

One nasty thing is that you must wrap the warning in a full `process.env.NODE_ENV === 'development'` condition manually each time — using any indirection _may_ confuse the replacement algorithms and prevent code removal:

```js
// devWarn becomes () => {}
function devWarn(msg) {
    process.env.NODE_ENV === 'development' && console.log(msg);
}
// but the call with the string is not removed
devWarn('oh no');

// looking across module boundaries may not work
import { isDev, env, dev } from '../env';
isDev && console.log('ooh no');
(process.env.NODE_ENV === dev) && console.log('no');
(env === 'development') && console.log('no');
```

## Error tracing

Modern web apps use many different libraries. When a developer sees your message, it may not be obvious where it came from. A good first step is replacing `console.log` with a `warn` or `error` that fires with a nice expandable stack trace:

![](/images/warn-trace.png)

In some frameworks (looking at you, React) the stack trace may not be that useful. If that's your case, provide extra identification inside the message:

`console.warn('[sum/useSum] dont use inital')`

Wording the warnings is important, too. Our current "inital is bad" is confusing — what's wrong with that option? Is my code broken? What should I do? Make sure to provide the motivation for the change and an actionable fix. Here: we made a typo, the code is OK until v2, please move to an option with a normal name when you have the time. Here we go: `"inital" option was a typo and will be removed in v2 - use "initial"` Feel free to provide a link to relevant docs / discussions if it's a particularly complicated matter. Remember, the messages are removed from production bundle, so there's no reason to save keystrokes here.

## Log once

Don't assume your users are stupid and bombard them with warnings — it's annoying and may drown other, more important, messages. I prefer showing every warning once — the users who care will clean up their code until no more warnings are left, and those who don't are free to go on with their business. Here's a way to do that:

```js
function warnOnce() {
    const logged = {};
    return (msg) => {
        if (!logged[msg]) {
            logged[msg] = true;
            console.warn(msg);
        }
    }
}
export const warn = warnOnce();
```

If you a particular warning really needs to fire several times, play around with `warnOnce` instancing — like `useMemo(warnOnce, [])` to warn once per React component instance.

---

Dev warnings are not only helpful for deprecations and breaking change announcements. Incorrect API uses deserve a warning, too — for example, the user could pass two conflicting options, or an obscure error would be thrown soon and you'd like to explain what caused it. Most dev warnings are a sign of bad API design, but they're a helpful tool nonetheless.

Here are some tips for great dev warnings:

- Wrap your dev warnings into a `process.env.NODE_ENV === 'development'` condition to strip them from the production bundle. No abstractions here, please.
- Make sure the source of the error is clear — use `console.warn / error` to show a nice stack trace and include the library name in the message itself.
- Clearly explain what caused the warning, the consequences of ignoring it, and suggest a fix.
- Don't drown the users in warnings — warn once.

Hopefully, these tips will help you improve your library developer experience. Warning is caring.
