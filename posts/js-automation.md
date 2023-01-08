---
title: Why I prefer JS for front-end build automation
date: 2022-02-14
tags: 
  - javascript
  - programming
  - frontend
  - developer experience
---


Every front-end project involves some automation to build it, test it, lint it, run dev servers, measure bundle size, and what not. npm scripts are fine for one-liners, but as the workflows grow more complex — run these things in parallel, then do something else, but only if building for production — you need a more coherent orchestration solution. In many projects, this means `bash` — it can handle anything, from the trivial `&&` to `if .. fi` mostrosities in separate shell scripts.

I must confess, I’ve never been comfortable with `bash`, and for years I’ve seen this as a weakness. But at some point I realized most front-end devs feel the same way. I took a closer look at JS, and it turned out to be a very nice tool for managing automation workflows! In this article, I’ll tell you what made me change my mind:

- Your team is probably most comfortable with JS
- Node is likely installed on your dev and CI machines
- Direct access to other JS tools
- Node is a cross-platform runtime
- Inter-process communication is async and fairly convenient

Let’s go — see if this convinces you to stop worrying and embrace JS for your automation. Many of these points also apply when comparing to `make` or `python` (yes, I’ve seen a JS project with python automation once). Here’s a quick comparison table, if you’re in a hurry:

![](https://thoughtspile.github.io/images/node-vs-bash.png)

## It’s your team’s primary language

Most front-end teams know JS better than bash or any other language. Sure, node has special APIs, but overall it’s the same familiar landscape of first-class functions, loops and promises. `bash`? I’ve spent years around it, and I’m still not sure how it works — the syntax is similar but different in unexpected ways, most variables are strings, do modules even exist? Pls don’t correct me if I’m wrong, I’m not 100% certain on this and I don’t care any more. I just google all the time.

Analogy time: Chinese language is beautiful and useful, but you probably don’t insist on speaking it at dailies unless your team is Chinese. Why would you go that way about programming languages? The argument that every half-decent programmer _must_ learn bash is ill-conceived — sure, it’s helpful in some cases, but why make it a requirement?

Your colleagues with other profiles (back-end friends or admins) who need to make an urgent change in your project are likely to know some JS, too. Many have done a random JS project or two, and the C-style syntax lets anybody get at least some idea of what’s going on. Granted, this is also the case with bash, but JS is no worse in this regard.

So, using JS for automation in a JS-first team is the most logical choice.

## The runtime is likely already installed

Your trouble doesn’t end once you get your `bash` script to work, because it will often fail on another machines (looking at you, alpine docker containers). [Various shells](https://en.wikipedia.org/wiki/Shell_script) (sh, ash, bash, zsh) are slightly different, and the available commands differ across linux distros. Fine, you can manually pick the necessary packages (more on that in a minute), or painfully recreate your logic manually, but it’s all a waste of time.

With node, the problem of missing runtimes is very rare — the CI machines probably run `npm` / `yarn` anyways, and these come bundled with `node`. Also, once your node program runs, it usually runs on every machine.

## Cross-platform out of the box

Which brings us to the next point — node is a cross-platform runtime that works fine on linux, mac, and windows. OK, MacOS is POSIX-compliant, but many commands still have minor differences in options and output format. Now, do you need Windows support? Most front-end devs I’ve seen use macs, and bash ports for Win exist. Still, supporting Win out of the box for free is always nice:

- It lowers barrier to contribution for open-source projects.
- Once I had to hastily launch a dev server on a Windows server, which was not pleasant.
- A manager wants to play around with your project, but he runs Win.

Node team has spent a lot of time abstracting the OS differences away. Ignoring that and sticking with bash is counter-productive.

## Direct access to other JS tools

Most tools in your front-end workflows (webpack / parcel / babel / postcss) expose node APIs. Even non-JS-based tools like [esbuild](https://esbuild.github.io/getting-started/#deno) and [swc](https://github.com/swc-project/swc/tree/main/node-swc) provide node bindings. If your orchestration runs on node, accessing these APIs is trivial: just import the package, and call the function.

With bash, you have two lousy options to integrate with node-based tools:

- Jump through hoops of calling the tools’ CLI with weird option formatting.
- Write a minimal JS wrapper to call the node API, and call it from bash, wondering where to draw the boundary.

As an added benefit, since many tools’ CLI lives in a separate package (like [`@babel/cli`](https://www.npmjs.com/package/@babel/cli)), you can skip installing it if you use the node API directly, shaving off a bit of `npm i` time.

## Decent inter-process communication

One positive technical aspect of node as an automation runtime is its IPC capabilities. Sometimes you prefer to use another tool via CLI over the node API. Cool — in node, this can be done with [child\_process](https://nodejs.org/api/child_process.html) — asynchronously, and in a cross-platform way! You can even pipe output between different processes, as with shell pipe `|`. Yes, the built-in `Stream` and `child_process` APIs are not too ergonomic, but you can always use a wrapper for your taste — I like [execa.](https://stackoverflow.com/questions/3004811/how-do-you-run-multiple-programs-in-parallel-from-a-bash-script)

`bash` is good at process management, too, but there are just too many possibilities for my taste — [this SO questions has five distinct ways of running commands in parallel,](https://stackoverflow.com/questions/3004811/how-do-you-run-multiple-programs-in-parallel-from-a-bash-script) and this makes it easy to shoot yourself in the foot if you don’t know what you’re doing (see point on familiarity).

## Vast ecosystem

`npm` has great packages for all sorts of problems. My favorites are [execa](https://github.com/sindresorhus/execa) for managing child processes, [yargs](https://github.com/yargs/yargs) for handling CLI options and [chalk](https://github.com/chalk/chalk) for output styling.

Yes, many command-line tools exist as well, but you must install them using an OS-specific package manager (apt? brew? apk?). Nobody really wants to deal with this, so you settle on lowest denominator of universal functionality. Besides, any CLI package that you happen to install can be used from node via spawn / exec just as well.

* * *

So, here are my top reasons to pick JS / node for managing complex automation workflows:

1. JS is your team’s primary language!
2. `node` runtime is usually installed both locally and in CI, since you’re dealing with `npm / yarn`.
3. `node` runs cross-platform, unlike bash and make.
4. `node` can directly access other JS tools.
5. `node` IPC (for orchestrating CLI tools) is very decent, especially with [execa.](https://github.com/sindresorhus/execa)
6. Many good packages exist for writing CLI tools in node.

There are reasons to _avoid_ node (like the lack of tutorials on automation use cases and the complexity of async for people unfamiliar with it), but I still believe it’s the most solid choice for build automation in JS projects.
