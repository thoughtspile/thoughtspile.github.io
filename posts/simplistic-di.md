---
title: 'OOP for FP lovers: Simplistic Dependency Injection'
tags:
  - javascript
  - programming
  - OOP
date: 2018-10-28
---


With all the enthusiasm around functional design in javascript community, we've come to reject the concepts whose names remind us of object-orientation. We throw constructors, methods and classes out of the window because they seem to smell of bank cubicles, water coolers and ERP. I've been on that train, but now I'm free from the prejudice. Great, useful ideas are hidden inside the fancy OOP terming, and I'm here to expose their niceness. We shall begin with Dependency Injection.

## We Have a Problem

I hear your teeth cringe as dusty IoC containers and AngularJS fly around your head. Take a deep breath and bear with me. Let's write a module, say, a User service, that _depends_ on other modules — a requester and the config. Normally, we code it along the lines of (for some imaginary redux-like state manager):

```js
import { getUserList } from './getUserList';
const config = {
  pageSize: 10,
  host: '192.168.0.0'
};

export const initState = () => ({ users: [] });
export function loadNextUsers(state) {
  return getUserList({
    limit: config.pageSize,
    offset: state.users.length,
    host: config.host,
  }).then(nextUsers => {
    state.users.push(...nextUsers);
  });
};
```

The dependency structure of this app is set in stone, allowing no fiddling. It causes two classic problems. The module is not too reusable: we can't customize the page size or host when loading the users. Testablity could be better, too: while we could have a `getUserList.mock.js` lying around for testing, replacing `config` in module's internal scope is probably excessively tricky, even if possible.

## STEP! Enter DI.

If we have _dependencies_, we can _inject_ them! All it takes in our functional example is passing them to `loadNextUsers` as a parameter:

```js
export const initState = () => ({ users: [] });
export function loadNextUsers(state, getUserList, config) {
  return getUserList({
    limit: config.pageSize,
    offset: state.users.length,
    host: config.host,
  }).then(nextUsers => {
    state.users.push(...nextUsers);
  });
};
```

That's not a huge change: instead of explicitly specifying and importing the dependencies inside a module, we do it one level above. By the way, `state` was injectable from the beginnning, allowing us to play with it or create multiple instances.

At first, it might seem like added verbosity and bookkeeping. But hey, look at the upsides! Now we can override the config as much as we like when loading the users: vary page size and the host (frankly, the host setting is a bit silly, but I couldn't think of anything better — just pretend it's super useful).

Testing becomes a joy. Instead of using a magic loader that takes not-the-module-we-specify-but-the-one-with-`.mock`-added-if-there-is-one, we can just call our function directly with a mocked dependency, using [node-tap](https://www.node-tap.org/) or even a bunch of `assert`s.

And the best thing is — we can use the explicit dependencies from the first example as default parameters, combining the best of both approaches.

This spirit of DI is what separates
- `sum([1,2,3,4])` from `reduce([1,2,3,4], (x, y) => x + y, 0)` — we _inject_ the reducer and the initial value.
- `mongoose` from `new Mongoose()` — this is brilliant API design, giving you ease of use for the 90% use case while providing an escape hatch to _inject_ [multiple databases](https://stackoverflow.com/questions/19474712/mongoose-and-multiple-database-in-single-node-js-project#19475270) if you need to.
- `alias: { 'react': 'preact-compat' }` in webpack from `@tappable({ h })` — yes, JSX-based helper libraries would have made us a favor by allowing to _inject_ the JSX provider instead of relying on bundler trickery.

## Are We Done Yet?

Our homegrown DI is not perfect — it has problems of its own compared to real IoC containers, such as [InversifyJS](http://inversify.io/). The more stuff we inject, the more positional arguments we have to pass around, which becomes painful. Moreover, somewhere in our code we are still bound to the physical location of source modules, importing and repeating ourselver over and over. So yes, real, unhip, enterprise flavor of DI solves real problems.

---

Please take some time to think it all over. DI is good. OOP is even better. They have non-hacky solutions to real challenges. Had it for over 20 years now, just sitting around. FP is good, too, for the same reason — not because of _elegance_, whatever that means. Meanwhile, I'll try to write more on the merits of loosely-understood OOP, so make sure to come back!
