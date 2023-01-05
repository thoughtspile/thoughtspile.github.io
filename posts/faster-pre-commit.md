---
title: How we made our pre-commit check 7x faster
tags:
    - infra
    - programming
    - javascript
    - typescript
    - eslint
date: 2021-06-14
---


As a guy who's somewhat responsible for a large chunk of front-end development infrastructure at our company, I've spent the last couple of months woried about the performance of our pre-commit checks. We have around 50 projects on a standard react + typescript stack, and a corresponding set of pre-commit checks: `eslint` + `stylelint` + `tsc` + sometimes, `jest`. This suite was taking anywhere from 10s on a starter project to 50s on a monstrous app — not fun. I set out to fix this — and I did.

## Cache your linters

The quick fix was to add `--cache` flag to [eslint](https://eslint.org/docs/user-guide/command-line-interface#options) and [stylelint](https://stylelint.io/user-guide/usage/options/#cache) calls. These tools process one file at a time, and caching makes them run very fast (around 1s for a normal commit instead of 10+). A quick [github search](https://github.com/search?l=JSON&q=eslint+src&type=Code) makes me sad, because few people seem to do this. Also don't forget to gitignore `.stylelintcache` and `.eslintcache`. __Gain:__ 50 -> 30s.

## Run the checks concurrently

Most checks were written like `eslint src && stylelint src/**/*.css && tsc --noEmit` — I assume the code was just being copied over. It's a waste for multi-core developer machines, and has an extra drawback of being unusable on windows (I don't think many front-end devs run windows, anyways). Making the checks run in parallel using [`concurrently`](https://github.com/kimmobrunfeldt/concurrently) or [`npm-run-all`](https://github.com/mysticatea/npm-run-all/blob/master/docs/npm-run-all.md) essentially makes the check run as fast as the slowest check — in our case, we were getting linters and jest for free, and `tsc` became the limiting factor. __Gain:__ 30 -> 28s.

## Cache tsc

[`tsc --noEmit`](https://www.typescriptlang.org/tsconfig/#noEmit) sounds like the way to go if you run `tsc` to type-check your code, not to build anything. However, it was impossible to combine `--noEmit` with `--incremental` for a long time, leaving you with no caching and slow builds. Luckily, [TS 4.0+ supports](https://devblogs.microsoft.com/typescript/announcing-typescript-4-0-beta/#noemit-and-incremental) this combination — just drop an `--incremental` flag and save time. If you're not ready to upgrade, [a workaround](https://stackoverflow.com/a/62622318) exists — you want the check to be faster, not to write exactly zero files, don't you? __Gain:__ 28 -> 7s.

## Do not break jest dependency detection

Lastly, I wanted to cover several ways to speed up [jest](https://jestjs.io/) if you happen to run it in your pre-commit (this is pretty rare). Obviously, you want to use [`jest --onlyChanged`](https://jestjs.io/docs/cli#--onlychanged) (or `jest -o`) to test only the files changed in the commit, not all the project. `jest` uses simple file-based dependency detection, no tree-shaking or anything — if you change file A, all the files that `import A` may have changed, and so on, and jest must run the tests for all the files that depend on A, too. You can work with this if you follow 2 rules:

1. Do no import `index.js` inside your project — this erases granular change checks for individual modules re-exported via index. In the worst case, if you import from a root-level index, _every_ change triggers all the tests.
1. Break frequently changed files into smaller chunks. Granted, it's good to use smaller modules in any case, but I bet you could start with your `utils.js` that contains 200 helpers. This will allow jest to make better guesses about what actually changed.

---

When pre-commit checks get slower, I see a lot of pressure to drop some checks and move them to CI. If you stick with slow checks instead, rest assured many developers will just `--no-verify` when commiting, which is probably not what you wanted to achieve. Lukily, you can easily make your pre-commit checks run in under 10 seconds:

1. Use `eslint --cache` and `stylelint --cache`
2. Run `tsc` with `--incremental` flag, or use a [workaround](https://stackoverflow.com/a/62622318) for TS <4.0
3. Parallelize the checks using `concurrently` or `npm-run-all`
4. Use `jest -o`, don't `import index`, and use smaller modules.

This can be done in 15 minutes, really. I've run some calculations for you — if you manage to strip 30s off your check time, assuming you make 5 commits a day and have a 3-person team (all this sound plausible), you're saving your team `3 * 5 * 0.5 * 250 / 60` = 31 hours a year, that's almost a week to spend better than waiting for pre-commit cheks. I really really hope you go and see if you can apply some of these techniques right now.
