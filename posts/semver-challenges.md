---
title: 'SemVer: The Tricky Parts'
tags:
  - open source
  - programming
  - javascript
date: 2021-11-08
---


Semantic versioning, is the way to version packages in JS ecosystem. I always thought I understood semver, but that illusion disappeared once I started maintaining libraries myself. Semver has tricky edge cases where it's unclear what the new version number should be:

- Should you bump anything after a refactoring? Can you have a refactor-only release at all?
- What's the new version after updating a dependency? (spoiler: it _depends_)
- Is dropping IE11 support a minor or major?
- Is fixing a bug always a patch-level change? (Spoiler: no)
- Does rewording "support multi-line content in button" to "fix multi-line button" turn a minor into a patch?
- What if a bug can't be fixed without a breaking change?

In this post, I'll explore these problems in depth, and share my tips on handling them.

![](/images/semver.jpg)

## A quick intro to SemVer

A Semanic Version, or semver, has a format of `major.minor.patch-(maybe) prerelease` — three numbers and some gibberish after a dash that we'll ignore for today. As [the semver spec](https://semver.org/) explains it:

- MAJOR makes incompatible API changes,
- MINOR adds functionality in a backwards compatible manner, and
- PATCH makes backwards compatible bug fixes.

The trick is, SemVer talks about the public API of your package, and the concept of _API_ is a bit fuzzy, so it's not really as strict as you'd expect.

In product front-end development, life is simple. Your product has no public API, no other code depends on it, so you don't really care. Three-number semver format is still useful, since many node tools support it, but you can do whatever you like with the numbers. Using a single number, incrementing it on every build, is just fine: `0.0.123 -> 0.0.124`, why not. Classic git flow works well with two numbers: minor for releases, patch for hotfixes: `1.1.0 -> 1.2.0`, then `1.2.1` if you fix a bug. You can also increment the major version to congratulate yourself on a particularly big feature: `1.2.0 -> 2.0.0` = _well done, Vladimir._ Really, anything works.

Once your code becomes a library (and I expect this to happen more often as micro-frontends grow), you need a way to communicate the API compatibility of your new releases to consumers. You need real semver, and you have two conflicting goals. First, you must follow the _semantic_ part of semver to tell the consumers if they can safely update. This also helps package managers decide if a particular version can be reused between several consumers, or must be duplicated. _But_ you also want to increment the version as slowly as possible — frequent breaking changes and even large minor increments are scary for your consumers, and may lead to duplicate versions of your library in the final app.

## SemVer no-ops

Sometimes you haven't really done anything visible from the outside, but still want to release. Refactorings, performance improvements, documentation changes fall in this category. In all these cases, I usually go with a patch update, because:

- Once a versioned package has been released, the contents of that version MUST NOT be modified. Any modifications MUST be released as a new version — [semver spec says so.](https://semver.org/#spec-item-3)
- It's hard to re-release a version with the same number anyways.
- It provides a way to identify the version if you created some new bugs.

On the other hand, [spec p. 7](https://semver.org/#spec-item-7) allows you to bump minor for _"substantial new functionality or improvements are introduced within the private code"_ but come figure what _substantial_ means. Anyways, see an [official discussion](https://github.com/semver/semver/issues/146).

## Changelog

SemVer is useless without a changelog: have a breaking change? Amazing, but what is it and what should your users do about it? Good places to maintain the changelog are [GitHub releases,](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository), `CHANGELOG.md`, confluence / dropbox paper / whatever for internal projects, a dedicated page in the docs, or even a pinned message in the support chat. Just make sure all your users know where to look for it.

## Releases with multiple changes

This one is clear, but keep an eye out: if you release changes in batches, the new version must be the largest of versions from each change. Some examples of a release after `1.2.3`:

- 3 bug fixes = patch, `1.2.4`
- 3 bug fixes + 1 feature = minor, `1.3.0`
- 3 bug fixes + 1 breaking change = major, `2.0.0`
- 1 feature + 1 breaking change = major, `2.0.0`

If you have a patch release planned, but add a feature to it, don't forget to change it to a minor release, etc.

## Breaking bug fixes

Say you release a buggy `1.2.3` — a dropdown component calls `onClose` on open. Strictly speaking, if you now stop calling `onClose` on open, you must release `2.0.0`, because it's a breaking change — your fix breaks apps that rely on `onClose` firing on open. On the other hand, a major release is likely to confuse everyone and scare them away from updating, so you should prefer `1.2.4`. There's no hard rule for situations like this, use your best judgement to decide if you can get away releasing the patch. Some things to consider:

- Can you know for sure if anyone actually relies on the broken behavior? Maybe search the codebase for internal projects, or ask around.
- Does the broken behavior make no sense or contradict the documentation?
- Has the bug been there for a long time? If you've been calling `onClose` on open for 2 years, since `0.0.1`, some users may well rely on it, especially if you didn't have an `onOpen`. If you just released it 5 minutes ago, just patch and deprecate the broken version ASAP.
- Can you support _both_ the broken and the fixed versions? This is often the case for typos, like `onColse -> onClose`. If you can — go with it, [warn](/2021/09/22/dev-warnings/) on the old name and don't forget to remove it in the next major release.

If you do release the breaking bufix as a patch, consider deprecating the broken version [via npm,](https://docs.npmjs.com/deprecating-and-undeprecating-packages-or-package-versions) mentioning it in the changelog and notifying your users in the support chat / twitter.

## Feature-like bug fixes

_Bug fix_ in semver terms is loosely related to normal person's idea of bug vs feature. Sometimes you can't fix a bug in the current API. In this case, _fixing_ it is a _feature,_ so you must release a _minor._ 

For example, your button component looks bad when you pass multi-line content. If you edit some CSS or adjust the display based on `offsetHeight`, it's a patch. If you add a special `multiline` option that users should pass for multiline content, you've just implemented a feature — _support multi-line content in buttons,_ so a _minor._

## Feature vs Enhancement

The [feature / enhancement distinction](https://stackoverflow.com/questions/27572557/scrum-terminology-what-is-the-difference-between-a-new-feature-and-an-enhanceme) happens to be much more practical in SemVer. Say, you improve the positioning of a dropdown so that it detects scroll overflow and automatically chooses the up / down direction. Is it a bug fix, because the old behavior was _incorrect,_ or a feature, because now your library does something it didn't do before?

I usually go for a feature (_minor_ increment) in these cases, because a _patch_ seems confusing, and a _major_ is scary, but you can choose a different path. Some PRs to semver spec ([#415](https://github.com/semver/semver/pull/415) or [#588](https://github.com/semver/semver/pull/588)) allow you to make such changes in a patch, since it does not affect the API.

## Type updates

Obviously, if your library has a TypeScript / Flow / whatever interface, any change to the interface type should be reflected in the version number. A type-only change, like exporting an interface that was internal, is a feature that deserves a minor bump.

## Dependency updates

What should the new version of your package be if you update a package B you depend on? Summary of the [official discussion:](https://github.com/semver/semver/issues/148)

- If your library completely wraps the dependency and your users can't interact with package B, ignore it and version as per _your_ change.
- If your library exposes the underlying package B by letting the users access its objects or passing through user options, find out if the minor / breaking changes in B affects the _exact part_ you expose. A safe & lazy option is to match your major / minor / patch update to the update in B.
- Updating a _peer_ dependency (like `React`), requires the users of your lib to also update that dependency, so it's breaking.
- Updating a _dev_ dependency is usually a no-op. Caveat: _if_ you update TypeScript _and_ use some new features in your public types, it's essentially a _peer_ dep update, so breaking. 

I often see libraries update deps in a minor. I'd rather not do that, but I'm not completely against it, as long as the update path for package B is safe. Updating peer major in a minor release is pure evil, though.

## Compatibility changes

Most libraries increase the major version when dropping runtime support. If your library runs in IE11, but then you add an unpolyfilled `.closest`, it's a breaking change because it may _break_ some apps that were supposed to run in IE11. _Increasing_ runtime compatibility (like adding a polyfill) is a no-op. The key here is the public compatibility guarantees you give — if you say "runs in IE11" in your docs, it's your API now, and dropping it is breaking. If you never promised IE11, you can argue that it just _happens_ to work as an implementation detail and ignore it in your versioning.

---

Here are my 10 semver lessons from 2 years of open-source work:

1. Internal changes, like optimizations and refactorings, get either a _patch_ bump or a _minor_ bump if they're _substantial,_ whatever that means.
2. Semver is useless without a good changelog detailing the chagnes.
3. Bump the highest component in releases with multiple changes: _bug fix + feature = minor._
4. A breaking change in a patch may be OK if it fixes a bug, and users are unlikely to depend on the broken behavior.
5. _Features_ don't change the API can fit into a _patch._
6. If a _bug fix_ touches the API, it's a _feature,_ so it gets a _minor_ bump.
7. Your public types affect semver, too.
8. Updating dependencies affects your version as much as you expose their API.
9. Updating peer dependencies is _breaking._
10. Dropping browser / runtime compatibility is _breaking._
