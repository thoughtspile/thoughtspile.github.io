---
title: 'TypeScript: escape from enum land'
tags:
  - typescript
  - javascript
  - programming
date: 2023-01-23
---

The idea

## Enums: the bad parts

First things first, what is so bad about `enum` that we'd want to avoid it? And even more, is it so bad you'd want to touch your perfectly working code? Plenty has already been said about this, but let's recap.

Before we get started, let me remind you that enums are a _very old_ TS feature: number enums were part of the initial 2014 release, `const enum` was added in 1.4. That's before: literal types, mapped types, unions / intersections. String enums were added in 2.4, making them a more modern feature. Still, that's before the most _comparable_ feature, unique symbols. Anyways, what I'm saying is, bashing enums is like bashing a 90-year-old. Enums were a cool concept, just the world evolved in a slightly unfavorable direction for them. So, for every critique, I'll try to justify _why_ it works that way.

### Enums emit code

The first objection to enums is that, unlike most TS features, they generate JS code that you didn't explicitly write.

Guess what? I don't have problems with that! TS class memeber initializers generate code, too, and I love these. But I do have issues, specifically, with the code generated for enums.

### Enums are not tree-shakable

Some will say that any effect a enum has on your bundle size is insignificant. That's not true: real-world examples inbound. We have a `enum` of all HTTP status codes, and it's 3Kb of raw JS, or 1Kb gzip, which is about 1% of our critical bundle — unreasonable given we only use `401 unauthorized` on the client to redirect to auth page. In a more extreme example, the GraphQL-generated `enum` of all 266 (our back-end team is pretty smart) client statuses, of which only 12 are applicable to our app, is 8.5Kb (or 3Kb gzip). This is not huge, but not negligible either.

The closest alternative, objects, is not exactly the king of tree-shaking either, but there are certain condition that make it happen. An even better option is to export a bunch of named variables — we'll get to this in a mminute.

### Number enums are hard to debug

### Number enums are not type-safe

### String enums are super strict

### Const enums don't work

### Deriving types from enums is _hard_

## The alternatives

### Union types

### Unique symbols

## Gradual migration

---
