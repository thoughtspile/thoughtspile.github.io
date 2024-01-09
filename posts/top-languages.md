---
title: The most useful programming language
tags:
  - career
  - programming
date: 2024-01-09
---

Aspiring developers often ask me what's the best programming language to learn. Personally, I mostly work with JS — solid choice, but everyone and their dog learns JS these days, so it might be time to add some diversity. I'm curious — which _single_ programming language covers the most bases for you, and gives you _most_ career opportunities for years to come? That's the question we'll try to answer today.

Here's the plan. I made a list of 8 tech specializations:

- 2 web development areas: back- and front-end. Both pretty big areas, and ones I have most experience with.
- Mobile and desktop native app development. Native app development (especially desktop apps) seems to have fallen out of favor, but there's still enough work in these areas.
- Quality assurance automation. QA grows along with engineering, and increasingly relies on automated tests.
- Embedded systems. We'll focus on microcontroller programming, not fat boxes with a full windows / linux OS. Quite a promising area with the growth of IoT.
- Game development. Granted, I don't know much about this area, but I'll do my best to cover it as well, as many developers dream of building a fun game someday.
- Data analysis and Machine Learning. One of the most hyped areas of the last decade.

The contenders are the usual suspects from [TIOBE top 20](https://www.tiobe.com/tiobe-index/): python, C, C++, Java (grouped with Kotlin and other JVM languages), C# (again, throw in VB and other .NET languages), JavaScript (and TypeScript), PHP, Go, Swift, Ruby, Rust. I left out SQL and Scratch, because they're not general-purpose languages, and Fortan with Matlab, because they aren't really used outside of scientific / engineering computing.

A language scores 1 point by being the industry standard in the area — vast community and ecosystem, abundant jobs. Being useful for _certain_ tasks in the area gets you 0.5 points.

So, let's see what languages will make you the most versatile engineer, shall we?

## Backend

Let's start with the simple one — Java,	C#, Python, PHP, Go and Ruby are all excellent back-end programming languages. Of these, I'd say PHP is slightly _more_ useful as many low-code solutions rely on it, and Ruby is steadily declining. Still, all these languages have earned 1 point.

Next, 0.5 points go to: 
- C++, used in high-load and time-critical scenarios, 
- JS — node.js is often used to support front-end, but there aren't that many strictly back-end jobs for JS developers.
- Rust — still not that widely used, but growing fast.

The only languages to fail here are Swift (technically usable on server via e.g. [vapor](https://vapor.codes/), but I couldn't find any jobs in this stack) and C.

## Frontend

Obviously, JavaScript is _the_ language for front-end developers, which runs natively in browsers. But, surprise, other languages still qualify!

All solid back-end languages (Java, C#, Python, PHP, Go, Ruby) get 0.5 points, because you can solve many UI problems by rendering HTML server-side the old-school way. C# has a slight edge here, since [blazor](https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor) is quite smart and popular.

C, C++, and Rust score 0.5 points because they can be compiled to WebAssembly and run in the browser — just look at [figma.](https://www.figma.com/blog/webassembly-cut-figmas-load-time-by-3x/) Rust also powers some cool JS tooling, like [biome](https://biomejs.dev/) and [swc](https://swc.rs/)

The only language to fail here is, again, Swift.

## QA automation

The topic of QA automation is really simple. 

Java and python get the cake — Allure, Selenium, JUnit, and pytest are the most sought-after automation tools on the market right now.

JS gets 0.5 points for playwright and cypress — the preferred tools for testing complex web front-ends. _A few_ automation tools support C# — worth 0.2 points.

## Mobile apps

Another straightforward area. Android apps are written in JVM languages (Java / Kotlin), iOS is integrated with Swift (finally).

JS scores 0.5 points, because you can effectively build apps with [React Native,](https://reactnative.dev/) and you can get pretty far with [PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) or a good old WebView.

Another 0.5 point for C#, thanks to [Xamarin](https://dotnet.microsoft.com/en-us/apps/xamarin) and [MAUI.](https://dotnet.microsoft.com/en-us/apps/maui)

## Desktop apps (windows / linux / MacOS)

The three kings here are C++, C#, and Java. JS gets 0.5 points, again, for [electron](https://www.electronjs.org/) — disgusting or not, it's widely used. Another 0.5 points for Swift, because that's what you build MacOS apps with, but MacOS computers are relatively niche.

Rust has the highly-hyped [Tauri](https://tauri.app/) project for building desktop apps, but it's not that widespread, and I'm not aware of any high-profile apps using it. Let's give each 0.2 points for the effort and check back later.

## Embedded systems

Embedded systems are usually tight on resources, so compiled languages are the way to go here. Basically any embedded job requires C and C++.

Rust is, as usual, _very promising,_ but not that popular yet, so 0.5 points. Another half-point for Python — used for edge computer vision and prototyping, but struggling with high memory requirements.

## Game development

The primary languages in big gamedev are C++ (used in Unreal Engine) and C# (for Unity).

Since mobile games are a thing, Java and Swift get 0.5 points each, because that's what you'll likely use here. Another 0.5 points for JS (browser games).

Rust _should_ be quite a good fit for games, but (as expected by now) it's not quite there yet.

## Data Analysis & Machine Learning

It's no secret that Python is the language of choice for anything data-related, and most of the cutting edge stuff happens, well deserved 1 point here.

But do you know there's another top language to get your piece of Data & ML hype? Big companies have a lot of data, right? And big companies love Java. So, many big data tools (especially coming from Apache — Hadoop, Spark, Jena) work with Java, and most data jobs require experience with python _or_ java, so another 1 point for java.

On to more surprises. Large chunks of data-heavy python libraries are actually written in C / C++ — e.g. over a third of [numpy](https://github.com/numpy/numpy), or most of [LlamaCPP](https://github.com/ggerganov/llama.cpp) — which earns both half-a-point. As you'd expect, Rust is also gaining traction for this use case with stuff like [pola.rs](https://github.com/pola-rs/polars), so another 0.2 points!

The final half-a-point goes to JS for powering much of the UI / visualization stuff (see e.g. [bokeh](https://github.com/bokeh/bokeh)).

---

Before we reveal our final ranking, let's weigh the categories, because they're _not_ the same size. I've used some back-of-the-napkin analysis of job postings and sizing of reddit / linkedin groups and my personal experience. With _backend_ as our reference, I'd say _frontend_ is roughly the same size. Mobile development is surprisingly sizable — let's give it a 0.6 weight. For QA, I'd say 0.2 makes sense, as 1 QA per 3–5 devs is a normal ratio, and manual QA is still a thing. Desktop is easily the smallest area, looks like a 0.1 to me. For gamedev, 0.5 is just my random guess. Finally, there are surprisingly many data people — with the good salaries, let's make it a 0.6.

Putting it all together:

![](/images/top-languages.png)

1. Java takes the first spot by a good margin by topping 5 categories, and having some gamedev / frontend capabilities. Place other JVM languages (especially Kotlin) around here, but with a discount since they're not as widely used.
2. The next three are really close, but JS gets _slighly_ ahead by being average at everything except embedded, even though it's only the top choice for front-end development.
3. Python and C# tie for the third place. Both are top-tier backend languages with other strong areas (QA / ML for python, desktop and gamedev for C#).
4. C++ is not that far behind either, as it's still the top language when it comes to efficiency. It also steps into other languages' realms when they need some speedup (WebAssembly / ML).
5. Next come "three backend friends" — Go, PHP, and Ruby. All top-notch languages for building web backends, but not much else beyond that. Of these, Ruby is on the decline, and PHP and Go both have their separate niches.
6. Rust does not score that well, but still makes it into the top 10 — not bad for such a new language. It has great growth potential by eating at the traditional C++ areas, super excited to see where it gets in 3–5 years.
7. We all love good old C, but C++ looks like a better fit for complex systems.
8. Swift comes in last — fair enough for a language that's only useful for the products of one single company.

Perhaps surprisingly, the _single most useful_ language is Java. Python and JS, beginner favorites, come strong, with a very different focus. C# perhaps deserves a bit more attention. 

Overall, today we've learnt about many amazing technologies that allow languages to sneak into each other's territory. If you were to start anew, what language would you learn?
