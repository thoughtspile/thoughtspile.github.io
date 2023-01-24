---
title: Making sense of TypeScript using set theory
tags:
  - typescript
  - javascript
  - programming
date: 2023-01-23
---

I've been working with TypeScript for a long long time. I think I'm not too bad at it. However, to my despair, some low-level behaviors still confuse me:

- Why does `0 | 1 extends 0 ? true : false` evaluate to `false`? 
- I'm very ashamed, but I sometimes confuse "subtype" and "supertype". Which is which?
- While we're at it, what are type "narrowing" and "widening", and how do they relate to sub/supertypes?
- If you want an object that satisfies both `{ name: string }` and `{ age: number }`, do you `&` or `|`? Both make some sense, since I want a _union_ of the functionality in both interfaces, but I also want the object to satisfy left & (and) right interfaces.
- How is `any` different from `unknown`? All I get is imprecise mnemonics like "Avoid Any, Use Unknown". Why?
- What, exactly, is `never`? "A value that _never_ happens" is very dramatic, but not too precise.
- Why `whatever | never === whatever` and `whatever & never === never`?
- Why on earth is `const x: {} = true;` valid TS code? `true` is clearly not an empty object.

I was doing some research on `never`, and stumbled upon Zhenghao He's [Complete Guide To TypeScript’s Never Type](https://www.zhenghao.io/posts/ts-never) (check out his blog, it's super cool!). It mentions that a type is just a set of values, and — boom — it clicked. I went back to the basics, re-formulating everything I know about TS into set-theoretic terms. Follow me as I:

- Refresh my knowledge of set theory,
- Map TS concepts to their set counterparts,
- Start simple with booelan, null and undefined types,
- Extend to strings and numbers, finding some types that TS can not express,
- Jump into objects, proving my assumptions about them wrong,
- Finally gain confidence writing `extends` caluses,
- And put `unknown` and `any` where they belong.

In the end, I solve most of my questions, grow much cozier with TS, and come up with this brilliant map of TS types:

![](/images/ts-sets/everything.png)

## Set theory

First up, a refresher on set theory. Feel free to skip if you're a pro, but my algebra skills are a bit rusty, so I could use a reminder of how it works.

Sets are unordered collections of objects. In kindergarten terms: say we have two apples aka _objects_ (let's call them ivan and bob, shall we?), and some bags aka _sets_ where we can put the apples. We can make, in total, 4 apple sets:

1. A bag with apple ivan, `{ ivan }` — sets are written as curly brackets with the set items inside.
2. Similarly, you can have a bag with apple bob, `{ bob }`.
3. A bag with both apples, `{ ivan, bob }`. Hold onto your hats, this is called a _universe_ because at the moment there's nothing in our world except these two apples.
4. An empty bag aka empty set, `{}`. This one gets a special symbol, ∅

Sets are often drawn as "venn diagrams", with each set represented as a circle:

![](/images/ts-sets/apples.png)

Apart from listing all the items, we can also build sets by _condition._ I can say "R is a set of red apples" to mean `{ ivan }`, considernig ivan is red and bob is green. So far, so good. 

Set A is a _subset_ of set B if every element from A is also in B. In our apple world, `{ ivan }` is a subset of `{ ivan, bob }`, but `{ bob }` is not a subset of `{ ivan }`. Obviously, any set is a subset of itself, and `{}` is a subset of any other set S, because not a single item from `{}` is missing from S.

There are a few useful operators defined on sets:

- Union _C = A ∪ B_ contains all the elements that are in A or in B. Note that _A ∪ ∅ = A_
- Intersection _C = A ∩ B_ contains all the elements that are in A _and_ B. Note that _A ∩ ∅ = ∅_
- Difference _C = A \ B_ contains all the elements that are in A, but not in B. Note that _A \ ∅ = A_

This should be enough! Let's see how it all maps to types.

## What does it have to do with types

So, the big reveal: you can think of "types" as sets of JavaScript values. Then:

1. Our _universe_ is all the values a JS program can produce.
2. A type (not even a typescript type, just a type in general) is some set of JS values.
4. Some types can be represented in TS, while other can not — for example, "non-zero numbers".
5. `A extends B` as seen in [conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) and [generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints) can be read as "A is subset of B".
6. Type union, `|`, and intersection, `&`, operators are just the union and intersection of two sets.
7. `Exclude<A, B>` is as close as TS gets to a difference operator, except it _only_ works when both `A` and `B` are union types.
8. `never` is an empty set. Proof: `A & never = never` and `A | never = A` for any type `A`, and `Exclude<0, 0> = never`.

This change of view already yields some useful insights:

- Subtype of type A is a _subset_ of type A. Supertype is a superset. Easy.
- _Widening_ makes a type-set wider by allowing some extra values. _Narrowing_ removes certain values. Makes geometrical sense.

I know this all sounds like a lot, so let's proceed by example, starting with a simple case of boolean values.

## Boolean types

For now, pretend JS only has boolean values. There are exaclty _two_ — `true` and `false`. Recalling the apples, we can make a total of 4 types:

- Literal types `true` and `false`, each made up of a single value;
- `boolean`, which is _any_ boolean value;
- The empty set, `never`.

The diagram of the "boolean types" is basically the one that we had for apples, just the names swapped:

![](/images/ts-sets/bool.png)

Let's try moving between type world and set world:

- `boolean` can be written as `true | false` (in fact, that's exactly how TS impements it).
- `true` is a subset (aka sub-type) of `boolean`
- `never` is an empty set, so `never` is a sub-set/type of `true`, `false`, and `boolean`
- `&` is an _intersection,_ so `false & true = never`, and `boolean & true = (true | false) & true = true` (the universe, `boolean`, doesn't affect intersections), and `true & never = never`, etc.
- `|` is a _union,_ so `true | never = true`, and `boolean | true = boolean` (the universe, `boolean`, "swallows" other intersection items because they're all subsets of universe).
- `Exclude` correctly computes set difference: `Exclude<boolean, true> -> false`

Now, a little self-assessment of the tricky `extends` cases:

```ts
type A = boolean extends never ? 1 : 0;
type B = true extends boolean ? 1 : 0;
type C = never extends false ? 1 : 0;
type D = never extends never ? 1 : 0;
```

If you recall that "extends" can be read as "is subset of", the answer should be clear — A0,B1,C1,C1. We're making progress!

`null` and `undefined` are just like `boolean`, except they only contain _one_ value each. `never extends null` still holds, `null & boolean` is `never` since no JS value can simultaneously be of 2 different JS types, and so on. Let's add these to our "trivial types map":

![](/images/ts-sets/finites.png)

## Strings and other primitives

With the simple ones out of the way, let's move on to string types. At first, it seems that nothing's changed — `string` is a type for "all JS strings", and every string has a corresponding literal type: `const str: 'hi' = 'hi';` However, there's one key difference — there are _infinitely many_ possible string values. 

> It might be a lie, because you can only represent so many strings in finite computer memory, but a) it's enough strings to make enumerating them all unpractical, and b) type systems _can_ operate on pure abstrations without worrying about dirty real-life limitations.

Just like sets, string types can be constructed in a few different ways:

- `|` union lets you constuct any _finite_ string set — e.g. `type Country = 'de' | 'us';`. This won't work for _infinite_ sets — say, all strings with length > 2 — since you can't write an infinite list of value.
- Funky [template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) let you construct _some_ infinite sets — e.g. ``type V = `v${string}`;`` is a set of all strings that start with `v`.

We can go a bit further by making unions and intersections of literal and template types. Fun time: when combining a _union_ with a _template,_ TS is smart enough to just filter the literals againts the template, so that ``'a' | 'b' & `a${string}` = 'a'``. Yet, TS is not _smart enough_ to merge templates, so you get really fancy ways of saying `never`, such as `` `a${string}` & `b${string}` `` (obviously, a string can't start with "a" and "b" at the same time).

However, some string types are _not_ representable in TS at all. Try "every string except 'a'". You could `Exclude<string, 'a'>`, but since TS doesn't _actually_ model `string` as _union of all possible string literals,_ this in fact evaluates back to `string`. The template grammar can not express this negative condition either. Bad luck!

The types for numbers, symbols and bigints work the same way, except they don't even get a "template" type, and are limited to finite sets. It's a pity, as I could really use some number subtypes — _integer, number between 0 and 1,_ or _positive number._ Anyways, all together:

![](/images/ts-sets/primitives.png)

Phew, we've covered all primitive, _non-intersecting_ JS / TS types. We've gotten comfortable moving between sets and types, and discovered that some types can't be defined in TS. Here comes the tricky part.

## Interfaces & object types

If you think  `const x: {} = 9;` makes no sense, this section is for you. As it appears, our mental model of what TS object types / records / interfaces was built on the wrong assumptions.

First, you'd probably expect types like `type Sum9 = { sum: 9 }` to act like "literal types" for objects — matching a single object value `{ sum: 9 }`, adjusted for referential equality. This is absolutely _not_ how it works. Instead, `Sum9` is a "_thing_ on which you can access propery `sum` to get `9`" — more like a condition / constraint. This lets us call `(data: Sum9) => number` with an object `obj = { sum: 9, date: '2022-09-13' }` without TS complaining about unknown `date` property. See, handy!

Then, `{}` type is not an "empty object" type corresponding to a `{}` JS literal, but a "thing where I can access properties, but I don't care about any particular properties". Aha, now we can see what's going on in our initial mind-bender: if `x = 9`, you can safely `x['whatever']`, so it satisfies the unconstrained `{}` interface. In fact, we can even make bolder claims like `const x: { toString(): string } = 9;`, since we can `x.toString()` and actuallty get a string. More yet, `keyof number` gives us `"toString" | "toFixed" | "toExponential" | "toPrecision" | "valueOf" | "toLocaleString"`, meaning that TS secretly sees our primitive type as an object, which it is (thanks to [autoboxing](https://javascript.plainenglish.io/javascript-boxing-wrappers-5b5ff9e5f6ab)). `null` and `undefined` do not satisfy `{}`, because they throw if you try to read a property. Not super intuitive, but makes sense now.

Coming back to my little "`|` or `&`" problem, `&` and `|` operate on "value sets", not on "object shapes", so you need `{ name: string } & { age: number }` to get objects with _both_ `name` and (extra hint: and = `&`) `age`.

Oh, and what about that odd `object` type? Since every property on an interface just adds a constraint to the "thing" we're typing, there's no way to declare an interface that filters out primitive values. It's why TS has a built-in `object` type that means specifically "JS object, not a primitive". Yes, you can intersect with `object` to get only _non-primitive_ values satisfying an interface: `const x: object & { toString(): string } = 9` fails.

Let's add all of these to our type map:

![](/images/ts-sets/everything.png)

## extends

`extends` keyword in TS can be confusing. It comes from the object-oriented world where you _extend_ a class in the sense of _adding functionality_ to it, _but,_ since TS uses [structural typing](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), `extends` as used in `type Extends<A, B> = A extends B ? true : false` is _not_ the same `extends` from `class X extends Y {}`.

Instead, `A extends B` can be read as _A is a sub-type of B_ or, in set terms, _A is a subset of B._ If B is a union, every member of A must also be in B. If B is a "constrained" interface, A must not violate any of B's constraints. Good news: a usual OOP `class A extends B {}` fits `A extends B ? 1 : 0`. So does `'a' extends string`, meaning that (excuse the pun) TS `extends` extends `extends`.

This "subset" view is the best way to never mix up the order of `extends` operands:

- `0 | 1 extends 0` is false, since a 2-element set `{0, 1}` is not a subset of the 1-element `{0}` (even though `{0,1}` does extend `{1}` in a geometrical sense).
- `never extends T` is always true, because `never`, the empty set, is a subset of any set.
- `T extends never` is only true if T is `never`, because an empty set has no subsets except itself.
- `T extends string` allows T to be a string, a literal, or a literal union, or a template, because all of these are subsets of `string`.
- `T extends string ? string extends T` makes sure that T is _exactly_ `string`, because that's the only way it can be both a subset _and_ a superset of string.

## unknown and any

Typescript has two types that can represent an arbitrary JS value — `unknown` and `any`. The normal one is `unknown` — the universe of JS values:

```ts
// It's a 1
type Y = string | number | boolean | object | bigint | symbol | null | undefined extends unknown ? 1 : 0;
// a shorter one, given the {} oddity
type Y2 = {} | null | undefined extends unknown ? 1 : 0;
// For other types, this is 0:
type N = unknown extends string ? 1 : 0;
```

On a puzzling side, though:

1. `unknown` is _not_ a union of all other base types, so you can't `Exclude<unknown, string>`
2. `unknown extends string | number | boolean | object | bigint | symbol | null | undefined` is false, meaning that some TS types are not listed. I suspect `enum`s.

All in all, it's safe to think of `unknown` as "the set of all possible JS values".

`any` is the weird one:

- `any extends string ? 1 : 0` evaluates to `0 | 1` which is basically a "dunno". 
- Even `any extends never ? 1 : 0` evaluates to `0 | 1`, meaning that `any` _might_ be empty.

We should conclude that `any` is "some set, but we're not sure which one" — like a type `NaN`. However, upon further inspection, `string extends any`, `unknown extends any` and even `any extends any` are all true, none of which holds for "some set". So, `any` is a _paradox_ — every set is a subset of `any`, but `any` _might_ be empty. The only good news I have is that `any extends unknown`, so `unknown` is still the universe, and `any` does not allow "alien" values.

So, to finish mapping our types, we wrap our entire diagram into `unknown` bubble:

![](/images/ts-sets/all.png)

---

Today, we've learnt to that TS _types_ are basically _sets_ of JS values. Here's a little dictionary to go from type-world to set-world, and back:

- Our universe = all JS values = the type `unknown`
- `never` is an empty set.
- Subtype = narrowed type = subset, supertype = widened type = superset.
- `A extends B` can be read as "A is subset of B".
- Union and intersection types are, really, just set union and intersection.
- `Exclude` is an _approximation_ of set difference that only works on union types.

Going back my our initial questions:

- `0 | 1 extends 0` is false because _{0,1}_ is _not_ a subset of _{0}_
- `&` and `|` work on sets, not on object shapes. `A & B` is a set of things that satisfy both `A` and `B`.
- `unknown` is the set of all JS values. `any` is a paradoxical set that includes everything, but _might_ also be empty.
- Intersecting with `never` gives you `never` because it's an empty set. `never` has no effect in a union.
- `const x: {} = true;` works because TS interfaces work by _constraining_ the property values, and we haven't constrained anything here, so `true` fits.

We still have a lot of TS mysteries to solve, so stay tuned!
