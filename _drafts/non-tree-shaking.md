---
title: Three ways to break tree-shaking
tags:
  - javascript
  - frontend
date: 2023-01-12
---

Tree shaking is an optimization technique commonly used to reduce bundle size.
https://webpack.js.org/guides/tree-shaking/

The recurring theme is that _objects_ are not very good at tree-shaking. When the bundler sees that you declare 

## Intro: why objects are bad for tree-shaking



Another minification concern (unrelated to tree shaking) is that mangling object property names is quite hard. If you have a variable with a `longButVeryDescriptiveName`, you can trivially rename it to `l` and replace every reference to it with `l`, because in runtime you can't access a varibale name anyways (unless you use `eval`. `eval` is evil). But to mangle object property names, you have to: 

- Replace property names in literals, eg `{ long: 9 } -> { p: 9 }`
- Now traverse the entire codebase, find every reference to the object and replace property names, e.g. `obj.long -> obj.p` (remember that the object can be assigned to variables, put into other objects and so on)
- Properties with the same name must be shortened the same way in case you pass them into functions (as in`[fn(obj1), fn(obj2)]`), or do `{ ...object, ...merging }`.
- Now our optiization is _busted_ if you convert objects to and from JSON, use `Object.keys/values/entries` or `for..in` or `'key' in obj`, or even just a simple dynamic access as in `obj[prop]`. The task gets _unreasonably_ hard.

At any rate, this results in a bunch of useless repeating strings across your codebase, not a deal breaker compared to pulling that 100K library.

## Object exports

```js
export const moneyUtils = {
  applyVat,
  convertCurrency,
};
```

```js
import { moneyUtils } from 'moneyUtils';

moneyUtils.convertCurrency(sum, 'USD', 'EUR');
```

The simple fix here is just to avoid putting independent helpers into an object:

```js
export { applyVat, convertCurrency };
```

This ensures that helpers not used anywhere in the project do not end up in the bundle.

When it comes to chunking, 

## TS enums

## Classes

```js
class Money {
  constructor(amount, currency) { ... }
  toCurrency(newCurrency) { ... }
  applyVat() { ... }
}

new Money(10, 'USD')
  .toCurrency('EUR')
  .applyVat();
```

```js
class Money {
  constructor(amount, currency) { ... }
}
const toCurrency = (money, target) => { ... };
const applyVat = (money) => { ... };

const total = new Money(10, 'USD')
applyVat(toCurrency(total, 'EUR'));
```

https://ncjamieson.com/understanding-lettable-operators/#using-prototype-patching

```js
// in applyVat.js
Money.prototype.applyVat = applyVat;
```

## Function properties

For another twist on the same topic, let's try 

```js
function sum(a, b) {
  return a + b;
}
sum.arrays = (arr1) => arr1.reduce(sum, 0);
```

Now the same, but in React:

```jsx
function Input(props) {
  return <input {...props} />;
}
Input.masked = ({ mask, ...props }) => {
  const maskProps = useFancyMask(mask);
  return <Input {...props} {...maskProps} />
};
```

While this allows you to write convenient things like `<Input.masked />`, this also means that a plain `<Input />` pulls all the mask-related code. In react case, this is almost impossible to avoid, as the code compiles to `createElement(Input)`, and for all compiler knows `createElement` might use `.masked` internally. Game over.

## Facades



```jsx
function PlainInput(props) {
  return <input {...props} />;
}
function MaskedInput({ mask, ...props }) {
  const maskProps = useFancyMask(mask);
  return <PlainInput {...props} {...maskProps} />
}
function Input(props) {
  return props.mask 
    ? <MaskedInput {...props} /> 
    : <PlainInput {...props} />;
}
```

## Default parameters

Maybe we can saver the day with default parameters?

```js
function Input({ useMask = useFancyMask, ...props }) {
  const maskProps = useMask(mask);
  return <PlainInput {...props} {...maskProps} />;
}
```

Now if we use `<Input useMask={() => ({})} />` our empty `useMask` will override `useFancyMask`, so it can be safely removed

https://github.com/floating-ui/react-popper/blob/master/src/usePopper.js
https://github.com/floating-ui/react-popper/issues/380

---