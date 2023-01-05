---
title: Cleaner ways to build dynamic JS arrays
tags:
    - javascript
    - programming
date: 2021-06-11
---


Building dynamic arrays in JS is often messy. It goes like this: you have a default array, and you need some items to appear based on a condition. So you add an `if (condition) array.push(item)`. Then you need to shuffle things around and bring in an `unshift` or two, and maybe even a `splice`. Soon, your array building code is a crazy mess of `if`s with no way to tell what _can_ be in the final array, and in which order. Something like this (yes, I'm building a CLI lint runner):

```js
let args = ['--ext', '.ts,.tsx,.js,.jsx'];
if (cache) {
    args.push(
        '--cache',
        '--cache-location', path.join(__dirname, '.cache'));
}
if (source != null) {
    args.unshift(source);
}
if (isTeamcity) {
    args = args.concat(['--format', 'node_modules/eslint-teamcity']);
}
```

Luckily, I'm here to end the struggle with three great ways to clean up this mess! As a bonus, I'll show you how to apply these techniques to strings as well!

## Chained concat

The first trick is to replace every `if` block with a `.concat(cond ? [...data] : [])`. Luckily, `concat` is chainable, and working with it is a joy:

```js
const args = [
    '--ext', '.ts,.tsx,.js,.jsx',
].concat(cache ? [
    '--cache',
    '--cache-location', path.join(__dirname, '.cache')
] : []).concat(isTeamcity ? [
    '--format', 'node_modules/eslint-teamcity'
] : []);
```

Much better! The array is consistently formatted and easier to read, with clear conditional blocks. If you're paying attention, you'll notice I missed the `unshift` bit — that's because at the beginning, you don't have an array to `.concat()` to. Why don't we just create it?

```js
const args = [].concat(source !== null ? [
    source
] : []).concat([
    '--ext', '.ts,.tsx,.js,.jsx',
]).concat(cache ? [
    '--cache',
    '--cache-location', path.join(__dirname, '.cache')
] : []).concat(isTeamcity ? [
    '--format', 'node_modules/eslint-teamcity'
] : []);
```

The `...spread` variant looks horrendous to me, but has less syntax and makes conditional blocks stand out from the static ones:

```js
const args = [
    ...(source !== null ? [
        source
    ] : []),
    '--ext', '.ts,.tsx,.js,.jsx',
    ...(cache ? [
        '--cache',
        '--cache-location', path.join(__dirname, '.cache')
    ] : []),
    ...(isTeamcity ? [
        '--format', 'node_modules/eslint-teamcity'
    ] : [])
];
```

## Truthy filtering

There's another great option that works best when conditional fragments are single items. It's inspired by [React's conditional rendering patterns](https://reactjs.org/docs/conditional-rendering.html#inline-if-with-logical--operator) and relies on boolean short-circuiting:

```js
const args = [
    // here, we have either "source" or "false"
    source !== null && source,
    '--ext',
    '.ts,.tsx,.js,.jsx',
    cache && '--cache',
    cache && '--cache-location',
    cache && path.join(__dirname, '.cache'),
    isTeamcity && '--format',
    isTeamcity && 'node_modules/eslint-teamcity',
// filter() removes falsy items
].filter(Boolean);
```

The reads like a flat array, with the important conditional logic consistently formatted to the left. Be careful, though, as this removes _any_ falsy stuff, like empty strings and zeroes. You can work your way around it with `filter(x => x !== false)`, but there's no way on earth to use it on an array that can have real `false` values.

Developing this method further, we can combine it with the conditional concat to get the best of both worlds: ability to group several items with one condition (repeating `cache &&` is not nice) and the conciseness of filtering:

```js
const args = [].concat(
    source !== null && source,
    '--ext', '.ts,.tsx,.js,.jsx',
    cache && [
        '--cache',
        '--cache-location', path.join(__dirname, '.cache'),
    ],
    isTeamcity && [
        '--format', 'node_modules/eslint-teamcity',
    ]
).filter(Boolean);
```

Here, we use the fact that `concat` [accepts any number of mixed items and arrays,](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat#concatenating_values_to_an_array) and `concat(false)` just appends a `false` to the end of the array. If `cache` and `isTeamcity` were false, you'd end up with

```js
const args = [
    source,
    '--ext',
    '.ts,.tsx,.js,.jsx',
    false,
    false,
]).filter(Boolean);
```

And the unneeded `false` values would then just be filtered away. This is my personal favorite technique for building dynamic arrays. And we can apply it to strings!

## Expanding to strings

Working with ES6 template strings is pleasant, but inserting fragments conditionaly is not:

```js
const className = `btn ${isLarge ? 'btn--lg' : ''} ${isAccent ? 'btn--accent' : ''}`;
```

There are two things I don't like about this version: the `: ''` blocks are pretty useless, and you often get irregular whitespace around skipped items — in this case, you'd have `"btn  "` (two extra trailing spaces) for a regular button. Luckily, we can apply the filter pattern to solve both problems:

```js
const className = [
    'btn',
    isLarge && 'btn--lg',
    isAccent && 'btn--md'
].filter(Boolean).join(' ');
```

This works even better for multiline strings:

```js
const renderCard = ({ title, text }) => [
    `<section class="card">`,
    title && `
        <h1>${title}</h1>`,
    `   <div class="card__body">
            ${text}
        </div>`,
    footer && `
        <div class="card__footer">
            ${footer}
        </div>`,
    `</section>`
].filter(Boolean).join('\n');
```

The formatting might seem a bit weird at first, but I honestly prefer it this way, and I built a code-generator thing that was 90% of this. Feel free to play around with indentation, though, if it's not your cup of tea.

---

Today, we've covered three techniques to bring messy array building code back under control:

1. Replace conditional blocks with `.concat(cond ? [...data] : [])`
2. Set some array items to `false` via `cond && item`, then `.filter()` them away.
3. Combine the two using `concat(item, cond && [...data]).filter(Boolean)`.

You can employ these methods for building strings as well: build an array of _string parts_ first, and `join` it together at the end. Good luck cleaning up your code!
