---
title: Don&#39;t trust JS library size, min+gzip
date: 2022-02-15
tags: 
  - javascript
  - programming
  - open source
---


Many modern front-end libraries and apps obsess over their bundle size. It’s a noble pursuit — an app that uses smaller libraries has less bloat, loads faster, and the users are happier. We can agree to that.

Measuring the impact of a library on the app’s bundle size sounds easy, but it’s absolutely not. Understanding the nuances of library size measurement is important both for maintainers _and_ users. In this article, I share some reasons not to trust the reported _min + gzip_ size, moving from mere curiosities to the more serious critiques:

- gzip size of a library together with your app is less than the sum of individual gzip sizes.
- App build pipeline can affect library size in unexpected ways.
- _Tiny library_ size is a random number.
- _Full size_ is a poor measure of a library impact under tree-shaking.
- Smaller libraries do not always mean smaller apps.
- Should the reported size include dependencies?
- Bundle size is a poor proxy for performance.

The quick solution? Install the library and check the size change for your particular app. And I have some advice for library authors, too!

## Why gzip lies

Library sizes are usually reported after gzip compression. This makes sense, since you’re probably going to serve your app assets with compression. But, lucky for us, gzipped library code is almost always _larger_ than the increase of app’s bundle size. If the library is 10Kb min + gzip, your users are likely to end up with a 9.8Kb increase.

Why? Gzip compresses data by looking for repeating words. Library code is likely to repeat much of the app code, so they gzip better together. For example, if I take [mobx](https://unpkg.com/mobx@6.3.13/dist/mobx.umd.production.min.js) (15656b) and [react](https://unpkg.com/react@17.0.2/umd/react.production.min.js) (4568b) and gzip them together, I get 19992b, not 20224.

Also, brotli is likely to compress [a few percent better](https://css-tricks.com/real-world-effectiveness-of-brotli/) than gzip (don’t take my word on it, try yourself). Some tricky library authors report their library size under brotli, which is smart, because it [has a pre-defined dictionary](https://en.wikipedia.org/wiki/Brotli#About) and requires less learning data. Beware: gzip size of one library is not comparable with brotli size of another.

Fun, but we’re talking about a difference of a few percent. That’s good to know, but does not totally subvert our expectations.

## Effects of the app build pipeline

The code that the library author measures and the code that goes into your app can be very different. There’s no deception involved, just the different build setups:

- Depending on browser compat targets, babel can add extra polyfills or do more transpiling.
- A bundled project that contains nothing but the library can end up larger than promised because of bundler runtime.
- Minification is very sensitive to small changes, like the number of chunks a function is imported into.

This can easily translate into 10–20% difference. But wait, there’s more!

## Very small libraries

In sub-kilobyte libraries the two effects create so much interference that the exact number stops making any sense. There’s just not enough data to properly “teach” gzip, so compressed size reflects the frequency distribution of characters more than anything remotely practical. Besides, since HTTP data moves in [packets](https://en.wikipedia.org/wiki/IPv6_packet), the actual transmission duration only changes when you cross a packet boundary, which is over 1Kb.

So, the exact size — be it 100, 157, or 200 bytes — does not matter, they’re all just _very small libraries._

## Full vs core size

We’ve started with the nitty-gritty details, but library size masurement presents bigger challenges than that. It’s not even clear _what_ should we measure! Suppose our library consists of 50 React components, but a normal app only uses 20 of them. What, exactly, is the _library size_ here?

The number you usually see is _full size_ — in our example, importing all 50 components. This makes sense, since it’s the worst-case metric, and nobody wants to over-promise and be called a liar for it. Moreover, full size is very easy to measure and does not require library knowledge — just `import * from lib`, measure the asset size, and you’re done. But it has many more disadvantages. As a user, you probably don’t really care about the size of 30 exotic components you’ll never use. Besides, full size favors libraries with _less_ functionality — if you have 20 components, and I have 50, your lib looks 2x smaller. Don’t get me wrong — it’s still useful to track full size, because it prevents you from adding a fat dependency anywhere. But don’t obsess about this number too much.

An direct opposite is _critical size_ — the size of the smallest usable subset of your library. For a UI kit, this probably means the necessary providers. As a library author, you should optimize the hell out of critical size, because every user of your library pays _this_ price.

The most sensible metric (that nobody uses) is _average size._ Most libraries contain some popular functionality sufficient for 90% uses, and a vast array of special-purpose stuff. Did you know lodash has `flatMapDepth`? Me neither. As a maintainer, try to focus your optimization effort on this subset. I know you it’s hard to know what, exactly, an average app uses, but give it your best shot.

At any rate, any reported number in a library with several independent parts is probably _not_ the size you care about. You really really have to install it and measure yourself. Oh, and if you maintain such a library and don’t support tree-shaking, you should stop reading right now and go fix that.

## Smaller lib != smaller app

So, comparing on bundle size favors libraries with less functionality. But using a smaller, less functional library can easily end up bloating your bundle more than a larger one with sufficient functionality. Why? Well, you’ll have to build the missing functionality yourself, and you may have to write more verbose code every time you use it. I don’t think I need to convince you that, all else being equal, you should prefer a library over writing more custom code.

Size should not be the deciding factor when picking a library, especially when it’s not an order-of-magnitude difference. Choose one that has the functionality you need, is well-maintained and widely used, and _then_ factor in the bundle size effect.

## Tracking dependencies

Another trick question for library size measurement: if your library uses library B under the hood, should you include library B into your size?

For peer dependencies, the answer is “no”. For example, a React component should not include React in its bundle size measurement. Why? Because anyone considering a using a React component is already using React, so it does not count towards increasing the final bundle.

All else is grey zone, but the same logic applies. If the app is likely to already use the dependency, using it has no extra bundle size cost. If the dependency is _exotic,_ it will probably be added to the bundle alongside your library, making it effectively a part of your library, so eligible for inclusion. This might not affect your _reported_ size, but is something to keep in mind for sure.

To further complicate the matter, yarn and npm [have different opinions on dependency version resolution,](https://github.com/yarnpkg/yarn/issues/3778) so the app might end up with multiple versions of the same package. Pro tip: [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) is your friend to look for duplicate dependencies.

What to make of it? Well, prefer libraries that use established dependencies under the hood. Sticking with the zero-dependency philosophy and writing all the needed functionality yourself seems attractive, but overall it leads us to a worse place where every trivial function is included into the app many many times, with no chance of deduplication.

## Does this even matter?

While min + gzip size is a convenient metric, it’s just a proxy for what we really want to measure — the time users spend waiting for the app to load. And it’s a poor proxy.

Most importantly, the assets are only _downloaded_ during the first visit. On subsequent visits, the script should load from cache (unless you really fuck up). Different use cases have different priorities for first-time vs recurrent visitors, but in most apps I’ve worked on the majority of visits were recurrent.

Then, bundle size is not always reflective of the start-up performance. Would you prefer a 1Kb library that takes 30ms to initialize, or a 10Kb library that initializes in 3ms? I’ll take the one that initializes quicker every day, because this price is paid by every user, not just the first-time visitors.

* * *

So, by all means — pick smaller libraries, avoid bloat, and have fun doing more with less. However, picking a _lighter_ library in 2022 means much more than looking whose readme claims to be closer to _0 bytes, min+gzip._ Here are top picks for users:

- Don’t rely on the reported min+gz size. Measure the bundle size change in your particular use case, with your build setup. There is no one-size-fits-all metric.
- Pick the right tool for the job. What good is a smaller library, if you have to write the missing functionality yourself?
- Prefer libraries with shared transitive dependencies if you don’t want your app bundle to contain the same logic over and over.
- Beware of tiny libraries. See exactly what tradeoffs they made to stay that small — are you OK with missing critical functionality or more glue code on your side?
- Prefer real-user metrics over synthetic bundle size.

And a few more tips for library authors:

- Please, design for tree-shaking if you still don’t.
- Consider both the critical, average and full sizes of your library.
- Relying on a large, but widely used dependency can end up better on average than staying zero-dependency.
- Maybe it’s time to drop IE11 support. It can be added with a pass of babel, but the built-in bloat can’t be removed.
- Being faster beats being smaller.

Finally, I made a cheat sheet with all the conflicting effects that can blur the reported size:

![](https://blog.thoughtspile.tech/images/lib-bundle-size.png?invert)

Hope this helps you build snappier apps without the unnecessary anxiety. See you later.
