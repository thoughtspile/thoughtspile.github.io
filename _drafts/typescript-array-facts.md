---
title: N fun facts about ypeScript arrays and tuples
tags:
  - typescript
  - javascript
  - programming
date: 2023-01-31
---

Reading comments to my article on [making sense of TypeScipt using set theory]() has been a lot of fun. "covariant types". I had no idea what this meant, but it sounded cool so I went to do some research. Just to spice things up, I present my findings as a very long list of facts (I do love lists).

Before we get to the actual list of facts, let me present you with a _disclaimer list:_

- The title is a clickbait, in reality only M facts on the list are fun.
- Some facts are quite useful, some are quite amusing, but I'm not sure if some are both useful and amusing.
- The favts are not ordered by fun-ness.
- We will be talking about TypeScipt tuples, _not_ tuples the JS proposal. TS [does not support](https://github.com/microsoft/TypeScript/issues/49243) JS tuples yet.

So, N facts await, let's go:

1. `T[]` is the TS type for a JS array of values of type `T`. E.g. `number[]` is an array of numbers, like `[1, 2, 3]`. You probably knew that.
2. Built-in generic type `Array<T>` is not a direct alias for `T[]`. I suppose it is, in fact, the other way around, but I'm not 100% sure.
3. Since ES specifications love adding new array methods, the TS declaration of the `Array` interface is split out across multiple `lib.es20xx.part.d.ts` files.
4. A built-in type called `ArrayLike` exists. It only guarantees number indexing and a numeric `length` property.
5. `Array<T> extends ArrayLike<T>`
6. `string extends ArrayLike<string>`, because strings are number-indexable and have a numeric `length` property.
7. Every type `T` has a corresponding array type `T[]`.
8. You can build interfaces with varying degrees of array-likedness yourself, starting with `{ [i: number]: T }`
9. Another array-related type is called `ConcatArray`.
10. Speaaking of, `concat` method on `Array<T>` is typed so that it only accepts arrays (or should I say `ConcatArrays`?) of type `T[]`
11. Luckily, array spread syntax `[...a, ...b]` allows you to concatenate arrays of different types.
12. Given `a: A[]` and `b: B[]`, the type of `[...a, ...b]` is correctly inferred as `(A | B)[]`.
13. If `T extends P`, then `T[] extends P[]`. In nerd-speak it's called "covariance".
14. Every JS array literal satisfies _infinitely many_ `Array` types. For `[1]` the narrowest type is `1[]`, then you can `(1 | 2)[]`, then `(1 | 2 | 'a')[]`, and so on.
15. Remarkably, the empty array, `[]`, satisfies _every_ TS array type, because it contains no elements to prove this claim wrong.
16. Every `Array<T>` type contains infinitely many possible values, except _maybe_ one very special `T` (see next below)
17. `never[]` is a very funny type that only contains empty arrays. Proof: if `x` satisifes `never[]` and `x` contains at least one element, `x_0`, then `x_0` must belong to type `never`. `never` is an empty set and contains no values, contradictin. Hence, `x` can not contain elements, and x is empty. 
18. Wheteher `never[]` contains a single value or infinitely many depends on wheteher you're willing to make a "referential-equality adjustment" and pretend that all empty arrays are one. This is more of a philosophical question, let's move on.
19. `never[] extends T[]` for any T, because every `T[]` contains an empty array. (Also, because `never extends T`, and array types are covariant).
20. Concatenating `T[]` and `never[]` gives you `T[]` because `never | T = T`, or, in common sense, because concatenating with an empty array gives you the criginal array back.
20. `(T & P)[] = T[] & P[]` (in nerd-speak, arrays distribute over intersection). Proof: 
21. `(T | P)[] != T[] | P[]`. Proof: `[1, 'a']` belongs to `(number | string)[]`, but not to `number[] | string[]`. `T[] | P[]` is a proper subtype of `(T | P)[]`.
23. JS arrays are mutable, which makes typing (in the sense of assigning types, not slapping keyboard with your fingers) them harder. If you have an array `[1,2,3]`, its type _could_ be `(1 | 2 | 3)[]`, but then you wouldn't be able to `push` any other value into it, so TS benevolently infers the type of `const x = [1, 2, 3]` as `number[]`
24. `ReadonlyArray<T>` type exists.
25. `Array<T> extends ReadonlyArray<T>`
26. `readonly T[]` is sugar for `ReadonlyArray<T>`. We could all benefit from declaring pure function parameters as `readonly` arrays, but it's too much typing, so we don't do it
27. Typed arrays (`Uint8Array`, `Float32Array` and friends) are _not_ `Array<Unit8>`, which is fair enough because a) `Uint8` type does not exist and b) `Uint8Array` does not actually inherit from `Array` and has different methods
28. The declarations for typed arrays are totally unrelated to each other and take up about 2/3 of ES5 typings. I wonder why, because in JS they all inherit from `TypedArray` class.
29. TS tuples are arrays 
30. `length` property of a tuple is a number literal type
30. `[]` could be a much better "empty array"
31. A single-type tuple of any length (`[], [T], [T, T]`) is a subtupe of `T[]`. So is a union of any quantity of tuple types. In theory, `T[]` could be defined as an infinite union `[] | [T] | [T, T] | etc`
32. A mixed-type tuple `[T, P], [T, P, Q]` is a subtype of a "union array" `(T | P)[]`, `(T | P | Q)[]`
33. A tuple containing `never`, like `[never]` is an empty type. Proof: it _must_ have an element at index 0, but the element _must_ come from an empty set, which is not doable.
34. `[never]` does not `extends never` even though both are empty types.
35. Of course, readonly tuples exist

37. One way to write a conditional generic that checks for `never` type is wrapping type parameter into a tuple: `type IsNever<T> = [T] extends [never] ? true : false`. 


14. Const assertion on an array literal, `[1, 2, 3] as const`, produces a readonly tuple type. It's neat because you know exactly the type of 