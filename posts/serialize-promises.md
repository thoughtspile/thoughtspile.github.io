---
title: 'Advanced Promises Coordination: Serialization and Concurrency Limiting'
tags: [promises, javascript, programming, concurrency]
date: 2018-06-20
---

I'm sure you can chain promises with `doBefore().then(() => doAfter())` and even
run multiple promises in parallel using `Promise.any`. However, chaining an
unknown count of homogenous promises is trickier. Let me teach you to serialze
promises like a pro!

Suppose we want a list of all the cafes in a mid-sized european country.However,
the API only lets you query the cafes by city. No problem — we have a list of
all the cities, and will send a request for each one, then assemble the results.

```js
const cities = [
  "Abertamy",
  "Adamov (Blansko District)",
  "Aš",
  "Bakov nad Jizerou",
  "Bavorov",
  "Bechyně",
  "Bečov nad Teplou",
  "Bělá nad Radbuzou",
  "Bělá pod Bezdězem",
  // ... and 200 more
];
const loadCafes = city => fetch(`api.fivecircle.com/city/${city}`);
```

## How Not to Chain Promises

The first naive attempts are no good:

```js
// All gone in a glimpse of eye:
Promise.all(areas.map(loadCafes)).then(cafes => db.save(_.flatten(cafes)));
// Still not good
areas.forEach(area => {
  loadCafes(area).then(storeData);
});
// More of the same
for (let area in areas) {
  loadCafes(area).then(storeData);
}
```

Since promises start executing once created, each of these options fires all
the requests at once. With sane rate limiting restrictions, it will fail.
A less elaborate server could even crash.

We could, of course, use `await`:

```js
let cafes = [];
for (let area of areas) {
  cafes = cafes.concat(await loadCafes(area));
}
storeData(cafes);
```

But I'm not a fan of this syntax — the code is now arguably C-like. I also
find error handling in promises cleaner. And now we have more preprocessing to do
for the code to work, which is nothing to be proud of. So let's go on and write this
in pure promises instead.

## Explicit Serialization

The best-known trick from this bunch is explicitly chaining an array of promises with
`<Array>.reduce`. It works best for fire-and-forget promises, like redux actions:

```js
return actions.reduce(
  (pre, action) => before.then(() => action()),
  Promise.resolve());
```

However, assembling return values is a bit awkward:

```js
areas.reduce((before, area) => {
  return before.then(acc => loadCafes(area).then(cafes => acc.concat(cafes)));
}, Promise.resolve([])).then(cafes => db.save(cafes));
```

Overall, this is good enough when you have an array of data you want to run the
actions on beforehand. But what if you don't?

## Implicit Serialization

We can actually write a wrapper for arbitrary promise-returning
functions that makes any call wait for the previous ones to finish. This wrapper
is completely transparent, leaving the function's interface intact — good for
composability. Here it is:

```js
function serializePromises(immediate) {
  // This works as our promise queue
  let last = Promise.resolve();
  return function (...a) {
    // Catch is necessary here — otherwise a rejection in a promise will
    // break the serializer forever
    last = last.catch(() => {}).then(() => immediate(...a));
    return last;
  }
}
```

Now we can just wrap our function and never have to worry about flooding the API again:

```js
const loadCafesSafe = serializePromises(loadCafes);
Promise.all(areas.map(a => loadCafesSafe(a)));
```

It's so easy it doesn't warrant a library — just five lines of code. And we can
take this idea further with...

## Concurrency Limiting

Serialization effectively forces our promises to run in one thread. To make them
go faster, we can generalize the serializer to allow not one, but at most N
promises to run simultaneously:

```js
function limitConcurrency(immediate, maxConcurrent) {
  // Each element holds its index, or a promise resolving with the index
  const workers = _.range(maxConcurrent);
  // Without this serialization, Promise.race would resolve with the same
  // worker whenever a concurrency-limited function was synchronously called
  // multiple times.
  const findWorker = serializePromises(() => Promise.race(workers));
  return function (...a) {
    // race resolves with the first free worker
    return findWorker().then(i => {
      // and here we start the action and update the worker correspondingly:
      const promise = immediate(...a);
      workers[i] = promise.then(() => i, () => i);
      return promise;
    });
  };
}
```

The idea is the same, but we replaced the single `last` promise with an array of
N workers and added some bookkeeping. This code packs promises into threads as
tightly as possible, with no idle time.

Also note that `serializePromises` is the same as `a => limitConcurrency(a, 1)`.

If you want to impose joint limiting on several arbitrary functions, you can tweak the
code — I leave this to you as an exercise ;-)

## Propagating Rate Errors

Now that our code manages a promise queue, we can see a potential problem in it.
The system can smooth activity spikes without propagating these upstream.
However, if the request rate is higher than what the upstream can handle for an
extended period of time, our queue can overfill and blow up the memory limit.

The problem still existed before we added the limiter, but would occurred
upstream instead. No wrapper can magically improve service throughput.

To handle these errors without crashing our process, we can put a hard limit on
queue size. Here's how it can be done for the generic `limitConcurrency`:

```js
function limitConcurrency(immediate, maxConcurrent, maxQueue) {
  // this is our queue counter
  let queued = 0;
  const workers = _.range(maxConcurrent);
  const findWorker = serializePromises(() => Promise.race(workers));
  return function (...a) {
    if (queued >= maxQueue) {
      return Promise.reject(new Error('Max queue size reached'));
    }
    queued += 1;
    return findWorker().then(i => {
      queued -= 1;
      const promise = immediate(...a);
      workers[i] = promise.then(() => i, () => i));
      return promise;
    });
  };
}
```

Now, instead of uncontrollably enqueueing, the coordinator rejects when there's
already too much work ahead. The consumers can handle these errors and retry later.

## Use Cases

So far we've been discussing an example with API requests, and you might argue
that concurrency limiting functionality should be provided bt the HTTP client
library. That's true, but the power of our promise-based strategy is its generality.
Here are some unorthodox use cases:

### "Sloppy Transactions" with Serialization

Suppose an action involves reading an external data source, computing on the
response and issuing an update. If the source changes between the read and the
update, you've corrupted your data beyond repair. You can instead wrap the action
with our "promise serializer". Of course, this assumes that the relevant data is only
accessed by your wrapper, and only by a single process. You can even build a
simple file-based database.

### Prevent Notification Flood with Concurrency Limiting

A front-end idea. You probably have a notification area somewhere on
the screen. However, if a large batch of notifications just arrived, the users are
likely to miss some of those. But now you can treat the currently visible
notifications as the running threads and apply `limitConcurrecny`!

A similar use case for modal windows uses serialized promises — you can't
show multiple modals at the same time, but now you can enqueue the next one
instead.

### Web Worker Thread Pool

Finally, time for some cutting-edge tech. If your web app heavily uses web
workers for background processing, you can wrap web worker access with a
promise-based API, then use our wrapper to limit the number of simultaneously
active workers. With several kinds of specialized workers, you might choose to
use a multi-factory flavour of our `limitConcurrecny` instead. I'll delve
deeper into this this case with an upcoming article on load balancing.

## Summary

We've learnt how to force promises to run consecutively and even to limit the
number of pending promises to a specified number. This technique can be used
for safer back-end access, and its generality allows to use it for any
promise-based API.

I'm not too good at writing: the topics kept expanding in my head, and I have
had a hard time finishing this article. I have two other interesting
promise coordination patterns to handle in future articles of this series:

- Rate Limiting
- Load Balancing

Wish me luck writing these! If you have some tips or want to argue, drop me an
e-mail.

**Advanced Promise Coordination Series**

- [Serialization and Concurrency Limiting](/2018/06/20/serialize-promises/)
- [Rate Limiting](/2018/07/07/rate-limit-promises/)
