---
title: Open source starter pack for JS devs
tags:
  - open source
  - javascript
date: 2021-11-20 16:25:25
---


So you've decided to open-source your project. Amazing! Bad news first: writing code is only the beginning. The information for library authors on the web is surprisingly fragmented, so I've decided to put together a list of things to keep in mind when open-sourcing a JS library:

- Decent docs, an OSS license, TypeScript definitions and a changelog are a must if you want anyone to use your library.
- Build setup of a library is different from that of an app — but even simpler, if you know what to do.
- `peerDependenies` are a thing (also, npm / yarn version resolution is a nightmare).

I'll give you enough info on each point to get started without going too deep.

I assume you're comfortable with [babel](https://babeljs.io/) and [webpack](https://webpack.js.org/) (or any other build toolchain), and have followed some [basic tutorial](https://www.digitalocean.com/community/tutorials/workflow-publishing-first-package-to-npm) on publishing an npm package. I also suggest you host your code on GitHub — it has a ton of features useful for OSS, and any other choice is just _bizarre_ in 2021. Let's pick up where you've written some code, pushed it to a public github repo, set up your `package.json` with `name`, `version` and `main`, and got `npm publish` to pass. There's still a bumpy ride ahead.

![](/images/oss-scream.jpg)

## Documentation

Your library will be used by people who have no idea what it's supposed to do, and how it works. For a small project, don't block yourself into building a fancy docs website — a `readme.md` file in the repo root is enough. Writing the actual docs is a better way to spend your time. Make sure to include:

- What problem does your project solve? Does your library do something I need?
- How to install it? Even if it's `npm i my-project`, don't make me guess the package name.
- A basic usage example. Just something to copy-paste and get started with it.
- Full API docs. What can the library do? Does it cover all my use-cases? What arguments do I pass where? I shouldn't have to read the source to answer these questions.

See [markdown cheatsheet](https://docs.github.com/en/github/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax) if you're not fluent yet.

## License

_(I'm not a lawyer, but this is my understanding)._ A project without an explicit license is closed source by default — the users can look at the code, but can't legally use it. [Choose an open-source license,](https://choosealicense.com/) copy the text into a `LICENSE` file to your repo, put the name in the `license` field of `package.json`, and probably mention it in the readme. [MIT license](https://mit-license.org/) is a good choice if you just want everyone to use your code and don't have a strong opinion on _everything must be open-source._

## Package structure

When building an app, you have some transpiler + bundler (probably babel + webpack, but anything goes) setup to turn your source into someting that runs in a browser. If you don't want to make your users jump around patching webpack config, you need _some_ of that, too. Exactly _how_ you should package your code is a complex topic, but let me scratch the surface for you. TLDR:

- If you use extended JS (JSX / TS / whatever), or want to support older runtimes with zero setup, do a `babel` (or friends) pass.
- Have a ES-module build for tree-shaking, and a legacy CommonJS build.
- Be clear about supported browsers / node versions. Too much = bloat, too little = broken apps for users who don't do extra setup (they won't).
- Never use global polyfills, and prefer well-supported APIs when possible.
- Don't bother bundling.

Just a touch deeper:

### Transpiling

The code you ship _must_ be standard ES to "just work" for your users. Convert JSX / TypeScript / Vue SFC / other fancy syntax down to JS with `babel`, `tsc`, or whatever `esbuild` you enjoy, and point `main` to the built version instead of your raw source.

The exact ES target (ES2020 / 6 / 5) is up to you — pick a browser / node target and stick to it. Your users _can_ transpile further down, if they're determined, but undoing an unnecessary transform is next to impossible — it becomes bloat in the final app. Also, some babel transforms (like [unicode regex](https://babeljs.io/docs/en/babel-plugin-transform-unicode-regex)) are _very_ verbose — have a look at the generated code once in a while.

The most important question is what to do with `import / export`. Read on.

### Tree-shaking

If your library runs in a browser, and it does more than _one_ thing, you'd better support [tree shaking](https://webpack.js.org/guides/tree-shaking/) — otherwise, every app using your library will ship useless dead code to the end users' browsers. To get started, create a modular build:

- Set `modules: false` in [`@babel/preset-env` config](https://babeljs.io/docs/en/babel-preset-env#modules) to preserve `import / export`
- Add `"sideEffects": false` or [list your side-effect modules](https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free) explicitly in `package.json`.
- Point the [non-standard `module`](https://webpack.js.org/guides/author-libraries/#final-steps) field of `package.json` to the resulting entrypoint.

Now a module-capable bundler can pick it up and remove unused code from the final bundle. Cool.

However, node <= 12 does not support import / export syntax _without a flag_. I'm lost in all the [new `"type": "module"` / `".mjs"`](https://nodejs.org/api/esm.html), but shipping a [fallback CommonJS build](https://web.dev/publish-modern-javascript/#modern-with-legacy-fallback) works fine in all node versions and older bundlers. For a library that works both client- and server-side, keep a CommonJS (`exports / require`) version (generated with a [pass of babel](https://babeljs.io/docs/en/babel-preset-env#modules) with `modules: 'commonjs'`), referenced in `main` field of `package.json`.

There's more to tree shaking — some patterns are not tree-shakable, it affects your API choices, complex topic. We'll save for it later — supporting basic tree-shaking with ES modules is always a good start.

### Polyfills

Should your library include the polyfills for recent browser APIs you use? It's a [surprisingly debatable issue](https://github.com/w3ctag/polyfills/issues/6) among OSS authors. Problem, short version: in most app setups, `babel` doesn't process `node_modules`, possibly breaking the final app in older browsers. _But_ if you include a polyfill, removing it is from an app that only targets modern browsers is super hard. Also, the final bundle is likely to contain duplicate polyfills of one API.

I'll stick with [Rich](https://github.com/w3ctag/polyfills/issues/6#issuecomment-272222513) [Harris](https://github.com/w3ctag/polyfills/issues/6#issuecomment-272651240) on this one:

- _Never_ include global polyfills that patch `BuiltIn.prototype` or `window` — they can clash with other global polyfills, and are not tree-shakable.
- Use helper functions (aka [_ponyfills_](https://ponyfill.com)) like `export function startsWith` if for code reuse.
- Prefer well-supported APIs if possible — using `str.indexOf(...) === 0` instead of `startsWith` is not _that_ hard.
- Clearly say what targets you support in the readme. Don't pretend to support IE11 if you're not very serious. Maybe provide instructions on setting up `babel-loader` to process your library.

### Bundling

You _could_ bundle your code, but I think it creates more problems than it solves at the start. How to exclude your dependencies from the bundle? What `libraryTarget` do you need? Are we sure bundling does not accidentally create non-tree-shakable logic? I'd stick with babel CLI and ship the code as separate JS files: `npx babel src --out-dir dist`.

## Typings

TypeScript is a major player in the JS ecosystem these days. Libraries without TS types explode in TS projects with `Could not find a declaration file for module '...'`, forcing users to either `@ts-ignore` it or slap together custom ambient declarations. Some lazier developers will probably move to the next library, and I won't blame them.

![](/images/no-dts.png)

Shipping TS types is actually easy: if you write in TypeScript, `tsc --declaration` (`--declarationOnly` if you build with babel, see [docs](https://www.typescriptlang.org/tsconfig#declaration)) into your build folder. If you write pure JS, it's even easier — just write a custom `index.d.ts` file describing your library, and copy it to build folder. Now point `types` field in `package.json` to the declaration entry point, and you're all set! Don't worry about `@types/*` pacakges for now. See full [TS docs on publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html#including-declarations-in-your-npm-package) if you have any trouble.

I don't know much about Flow, and no one ever asked me to support it, but if you're a fan, see [SO tips on doing that.](https://stackoverflow.com/questions/61889988/exporting-my-own-flow-type-with-npm-package)

## Understand dependencies vs dev/peerDependencies

In app development `dependencies` (`npm i`) vs `devDependenices` (`npm i --dev`) is not a real issue — sure, `dev` is for your build pipeline, `dependencies` for real runtime libraries, but it mostly works fine if you mess up. The difference is critical for libraries, though:

- `devDependencies` are not installed after `npm i your-lib`.
- `dependencies` are automatically installed along with your package. If the user (or some other package) requests a different version of the same dependency, they may get duplicated, but at least it usually works.
- `peerDependencies` allow you to reference a package explicitly installed by your users. This ensures the dependency instance is shared between user code and your library, which is crucial for _plugins_ — react components, express middlewares, etc. In effect, this forces a single dependency version per app — your users can't upgrade to react 18 until you support it. Assume the users have to install peers manually — sure, npm 7+ installs [them automatically](https://github.blog/2021-02-02-npm-7-is-now-generally-available/#peer-dependencies), but [yarn](https://github.com/yarnpkg/yarn/issues/1503) and [pnpm](https://github.com/pnpm/pnpm/issues/827) don't. People hate manually installing stuff they don't care about to get the project to build, so don't overuse peers.
- [bundledDependencies](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#bundleddependencies) and [optionalDependencies?](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#optionaldependencies) You don't need them.

Basic guideline: all the runtime dependencies go into `dependencies`. _Plugins_ should put the main library into `peerDependencies`.

## Changelog

I install your library, and I'm happy with it. Some time later, it's friday evening and I can't get real job done any more. I decide to update my dependencies, and discover that your library moved from `1.0.3` to `2.3.0`. 

- Have you fixed some important bugs, so that I need to update __right now__?
- Have you added new features I might enjoy?
- What's the breaking change in v2, and how do I update?

To answer these questions, I'd love to see a changelog saying what changed in every version since `1.0.3`. Both [GH releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) and a `CHANGELOG.md` in the root work fine. Otherwise, I'll have to read the commit / PR list, which is likely to make me very sad.

---

So, here's my list of stuff to keep in mind when publishing a JS library:

Must have:

1. A readme with a problem statement, installation command, hello world example, and full API docs.
1. A license: full text in project root, name in the readme and in `package.json`
1. TS typings (unless it's a CLI tool).
1. Changelog in GH releases or a `changelog.md`.

Managing dependencies:

1. Runtime `dependencies` go into `package.json`
1. _Plugins_ make the _master library_ a `peerDependency`

Build setup:

1. Transpile the code to standard JS.
1. Running in browsers? Ship es-modules entrypoint in `package.json` `modules` for tree shaking.
1. Running on node? Ship CommonJS entrypoint in `main`.
1. Avoid global polyfills.
1. Don't bundle.
