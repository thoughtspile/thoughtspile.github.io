---
title: Five Tricks for Debug-Logging in JavaScript
tags:
  - javascript
  - programming
  - frontend
  - tips
date: 2018-10-05 13:33:42
---


Cheer up, today is a quick tip day. No [rants](/2018/09/23/bad-software-week/), no [motivation](/2018/09/23/bad-software-week/), no existentialism — just a few simple tricks you can use right now.

We'll be talking about `console.log` and friends for debugging javascript, mostly in the browser. If you don't use devtools debugger — try it, but I'm not here to judge you (unless you use `alert`). There is at least one case where `console` is better: you have a method that gets called frequently, and want to inspect the internal state over multiple runs, then drill down on the interesting ones. Pausing on every hit would be extremely tedious.

## Logging in concise arrows

If we want to log something inside a function written in concise arrow syntax (the one without curly braces), you might find yourself adding and removing the body and changing formatting — very boring and error-prone:

```js
promise.then(res => res.data.age);
// what else was there in res?
promise.then(res => { // meh the braces... enter...
  console.log(res); // this is the thing... enter...
  return res; // oh and the "return"
});
```

No need to suffer! Since `console.log` returns `undefined`, which is falsey, we can just write:

```js
promise.then(res => console.log(res) || res.data.age);
```

## Beware of post-log object mutation

My most painful session of console-debugging was related to this one. Oh, times. I must admit, this problem does not exist for debugger pauses. Yet, for what it's worth, let's say we have a `city` object, and something's wrong. Let's log it:

```js
const city = { name: 'Vladivostok', poulation: 606589 };
console.log(city); // { name: null, population: 606589 }
```

What the hell? Where is the name? You try. You try again. You start suspecting V8 just shipped with multi-threading. You try again. Guess what? In a far away area of your code there's a

```js
city.name = null;
```

The solution is simple: if you see the data look weird (or just want to double-check), dump a clone / cloneDeep (to triple-check) / stringify:

```js
const city = { name: 'Vladivostok', poulation: 606589 };
console.log(JSON.stringify(city));
// "{ "name": "Vladivostok, "population": 606589 }"
```

## Quickly filter logs by condition

Another trick with boolean short-circuiting is conditional logging. Suppose we have an array of users, and there's a bug displaying users from Australia. But if you log all the users, there is a lot of eye-scanning to find the necessary ones. Booelan short-circuiting to the rescue again, with `condition && console.log(data)`

![](/images/conditional-logging.png)

Bad code style? Sure. But you'll remove it in a minute anyways.

## Make your logs stand out

With a lot of logs running around your console, finding the ones you just added is no easy task.

![](/images/painted-log.png)

If you use `console.error` or `warn`, your line will be brighter-colored and easier to find. At least until you write 20 `console.warn`s.

## Dump stack traces with `console.error`

The final tip will help you find _who_ called the function, instead of _how_. `console.error` conveniently captures the stack trace and shows it in a nice collapsible way. You can quickly look around and find all the call sites — very neat.

---

That's all for today! Hit the comments if you use know another neat logging trick, or want to blame everyone for not using real loggers, or for not using the debugger. Would love to make a teaser for the next post, but have not chosen yet. *Hasta la vista!*
