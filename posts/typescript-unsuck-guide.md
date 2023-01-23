---
title: 'Not Sucking at TypeScript: 3 Tips'
tags:
  - typescript
  - javascript
  - programming
  - tips
date: 2018-09-22
---

I have spent three years developing in TypeScript, but sometimes it is owerwhelming. I'm sitting there with all those little "fuck-fuck-fucks" in my head, thinking of how I'd great it would be to burn the annotations, change the extensions to `.js` and get out of this nighmare already. But hey, if used properly, TS makes you happy, not depressed! Here are my top 3 tips to ease the pain.

## Let TS do its type inference

Here's a sample typescript fragment from one of my projects:

```ts
function maxNumber(arr: number[]): number {
  let max: number = -Infinity;
  arr.forEach((x: number) => {
    if (x > max) {
      max = x;
    }
  });
  return max;
}
```

But TS compiler is really good at deducing types, so you don't to be that explicit! TS deduces types from:

- initial values: `const x = 10` is enough, no need for `const x: number = 10;`. This also works on default values, as in `(x = false) => !x`;
- array method types (any generic specifications, really): if `arr` is `number[]`, than x in  `arr.forEach(x => ...)` is obviously a `number`;
- return values: in our example, TS knows pretty well that `max` is a `number`, so the function returns a `number`.

So, our examle only needs one type annotation:

```ts
function maxNumber(arr: number[]) {
  let max = -Infinity;
  arr.forEach((x) => {
    if (x > max) {
      max = x;
    }
  });
  return max;
}
```

As a bonus, once we the annotations do not duplicate, we can easily change types without having to fix half a file. In our example, we changing `arr` to `string[]` immediately shows that we must also change the initial value of `max` to a string, `''`.

As a rule of thumb, we only need explicit type annotations for:

- Function parameters: `(x: number, y: number) => x + y;`. As we've seen, default values will also do: `(x = 0, y = 0) => x + y;`.
- Empty containers: `private users: IUser[] = [];`. TS does not see an item, and can't know its type.
- Values coming from outside the codebase. This one's trickier, but think af an API call: `get<IUser[]>('/users')`.
- (Yes, there are other cases, you'll know it when you see one, don't get mad at me).

![](/images/ts-just-enough.png)

Generally, annotate as few types as you can, then check the IDE hints to see if TS got it right. If not, help him.

## Sometimes, just let types go

I'm absolutely guilty of this one: I've spent a day once typing a tricky low-level canvas util. Always remember that TS is supposed to help you, not stand in your way.

If you find yourself describing an especialy tricky type — a generic generic, or a polymorphic variadic function — stop and think if you really need it. Maybe the logic is just too obscure, and the fancy typings are just a symptom. Maybe you only use that function in one place, and it already works, so what's the use?

With TS, you always have an easy way out — there's no shame in dropping an `any` if it saves you a day! An explicit `any` is better than implicit beacuse if you're feeling static on a Friday afternoon, you can grep your codebase for `/: any/` and see if you can fix a couple.

## Prevent compilation error buildup with global overrides

![](/images/ts-errors.png)

Accidentally you slip and ignore a TS error. The code still compiles, no harm done! But once your compilation log is several 10+ of bloody redness, it's lost as a source of information about global project correctness. The generic advice is "look if it's a real error, then either fix or re-type it", but yes, I do have something specific in mind. Global type overrides are your friends!

Sure your browser targets support `<Array>.find`, or have a polyfill ready? Override the global `Array` type (courtesy of [user75525 at SO](https://stackoverflow.com/questions/31455805/find-object-in-array-using-typescript))!
```ts
interface Array<T> {
  find(predicate: (search: T) => boolean): T;
}
```

Working on a legacy project with lodash loaded globally via a CDN? Throw it in:
```ts
import * as lodash from 'lodash';
declare global {
  const _: typeof lodash;
}
```

Using an obscure jQuery plugin? Global type overrides got you covered:
```ts
export interface JQuery {
  webuiPopover: (o: any) => JQuery;
}
```


## Love the types you're with

Hope this tips will help you be less depressed and more productive when working with TypeScript.
