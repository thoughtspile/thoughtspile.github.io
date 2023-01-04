---
title: 'Advanced Promise Coordination: Rate Limiting'
tags:
  - promises
  - javascript
  - programming
  - high availability
date: 2018-07-07 10:11:13
---


In the [previous post](/2018/06/20/serialize-promises/) we learnt to serialize
and concurrecy-limit promise-based operations in js. This time we dive further
and handle rate limiting.

## What Exactly to Rate Limit

Let's get terminological matters out of the way first. Promises represent operations
that last a certain amount of time, while rate limiting is applied to discrete events.
Over its life, a promise starts and terminates (with a success or a failure, not
important now). It makes most sense to rate limit promise creations (starts).
Rate limiting promise resolutions can be done by appending a start-rate-limited
promise onto the end of the running promise. We could also limit the gap
between operations, but I have no idea how that would be useful.

## Rate vs concurrency limiting

While both rate and concurrency limits are trying to prevent a client from
overloading the server by making too many calls too fast, they do not replace
one another, and are implemented differently.

Suppose an API is rate-limited to 1 request per second. Even 1-concurrent requests
break the rate limit if they complete in under 1s. On the other hand, if the
requests take 3 seconds to complete, we can only have 3 of them running at the same time:

```
...
 ...
  ...
```

We could derive a bunch of formulae to connect the concurrency, rate and
running time of operations, but that's completely beside the point. The thing to
remember here is that without strict guarantees on operation duration you can
not replace concurrency limit with rate limit or vice versa.

## Rate limiting individual operations

The simplest form of rate limiting is "1 operation per N seconds". This one is
straightforward, but first we need a building block — the promise counterpart
of `setTimeout`:

```js
const resolveAfter = ms => new Promise(ok => setTimeout(ok, ms));
```

`resolveAfter` is self-explanatory: it returns a promise that resolves after
the specified time has elapsed. Now, for the actual rate limiter:

```js
function rateLimit1(fn, msPerOp) {
  let wait = Promise.resolve();
  return (...a) => {
    // We use the queue tail in wait to start both the
    // next operation and the next delay
    const res = wait.then(() => fn(...a));
    wait = wait.then(() => resolveAfter(msPerOp));
    return res;
  };
}
```

Now we can, as usual, wrap the promise and call with no worries, the operations
are magically delayed:

```js
const slowFetch = rateLimit1(fetch, 1000);
Promise.all(urls.map(u => slowFetch(u)))
  .then(raw => Promise.all(raw.map(p => p.json())))
  .then(pages => console.log(pages));
```

The 1-rate-limiter can also be elegantly implemented on top of serializer
with the pitfall of unnecessarily delaying the first operation:

```js
function rateLimit1(fn, msPerOp) {
  const wait = serializePromises(() => resolveAfter(msPerOp));
  return (...a) => wait().then(() => fn(...a));
}
```

## Rate limiting multiple operations

Many APIs feature soft rate limits instead: they allow `M request per N seconds`.
That is not equivalent to `1 request per N/M seconds`! Converting the multiple
rate limit into individual one does fulfil the rate limit, but is overly harsh
and non-optimal. Let's see this through examples.

### Difference from individual rate limit, by example

Suppose you're flying a plane, and the airline allows 10 kg of luggage per
passenger. If you're travelling with a girl, and have one 16-kg bag with both
your things. At the check-in desk you're asked to take out half the stuff in
your bag to make two 8-kg items. While formally correct, it feels idiotic —
you still add the exact same weight to the plane! But now, why would you enforce
such a stupid restriction on your own operations if you can do better?

Closer to the topic, let's try 2-req-per-2-sec rate limit for operations
lasting 2 seconds. If you immediately fire 2 requests, you're done in 2 seconds:

```
----| 2 seconds, all done!
----|
```

Converting this into 1-req-per-1-sec delays the second request by 1s, and
now the same 2 requests take 3 seconds! You just lost a second for no reason.

```
----  | 3 seconds
  ----|
```

### Understanding

To understand what we should do, let's have a closer look at the 1-rate-limit.
We essentially make a queue of promises that never resolve closer than `delay`
apart. We use the resolutions to start the next operations, and don't care
about its termination at all:

```
*--*--     *--*--
```

This view extends to N-rate-limit: create N independent queues and put these
into a circular queue (yes, a queue of queues makes a good _in Soviet Russia_
joke):

```
*--*-- *--*--
 *-- *--*--  *--
 *--  *-- *--    *--
```

The individual queues are unchanged, and never fire more than 1 operation per N
seconds. Thus, M queues can fire at most M operations during the window.

### Implementing

With this plan in mind, we can generalize the implementation:

```js
function rateLimit(fn, windowMs, reqInWindow = 1) {
  // A battery of 1-rate-limiters
  const queue = _.range(reqInWindow).map(() => rateLimit1(fn, windowMs));
  // Circular queue cursor
  let i = 0;
  return (...a) => {
    // to enqueue, we move the cursor...
    i = (i + 1) % reqInWindow;
    // and return the rate-limited operation.
    return queue[i](...a);
  };
}
```

## Preventing queue overflow

Just as before, we run into problems if the operations are consistently inserted
into the queue faster than the rate limit. The solution is the same: once the
queue exceeds the specified number of items, we immediately reject the incoming
operations.

## Combining with concurrency limiting

Now that we know how to limit both the rate and the number of simultaneously
running operations, and since neither is a substitute for another, we want a
way to combine the two limits. But can we build the joint rate/concurrency
limiter by composing the primitive limiters? Turns out we can, but should carefully
choose the order.

`rateLimit(concurrencyLimit(fetch, N), ms)`, limits the rate at which the
operations enter the concurrency-limit queue. Serialized (1-concurrent) promises
rate-limited to 1 second break this combination. Suppose the first operation runs for
2 seconds, and during that time we throw 2 fast operations, O_2 and O_3 (say,
10 ms each) into the serializer. Instead of waiting for 1 second, the O_3 starts
right after O_2 completes, or 10ms after it starts, breaking the rate limit.

`concurrencyLimit(rateLimit(fetch, ms), N)` limits the number of operations in
the rate-limit queue. Since the rate limiter only sees N operations at a time,
it has no chance to fire more than N, which is exactly what we want.
Hence, **Chaining Rule 1: limit concurrency before rate.**

## Use cases

The classic and most appropriate rate-limiting use case is for API requests.
But now that you know the pattern, you will see it in your own tasks and,
hopefully, use it ;-)

Promise-based rate limiting is a great way to quickly hack together a safe API
wrapper without depending on the underlying HTTP / TCP / WebSocket client.

Frankly, other use cases I can come up with off the top of my head (render
throttling and preventing too many e-mail notifications) are better served by
batching. Maybe, you'll have better luck.

## Summary

We've learnt to rate-limit promise-based APIs, both for the simple
"1-action-per-N-seconds" and the more general M-actions case. Together with the
previously discussed concurrency limiter, these patterns allow us to build robust
service gateways with node.js, safely call external APIs and do all the other
things you come up with.

Planning note: I've decided to throw away the excessively tricky part on load
balancing and go with super fun and useful posts on *batching* and *handling failure*.
I have RSS now, so be sure to stay tuned!

**Advanced Promise Coordination Series**

- [Serialization and Concurrency Limiting](/2018/06/20/serialize-promises/)
- [Rate Limiting](/2018/07/07/rate-limit-promises/)
