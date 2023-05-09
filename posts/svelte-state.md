---
title: Svelte reactivity — an inside and out guide
tags:
    - svelte
    - programming
    - javascript
date: 2023-04-22
---

I've been working with svelte exclusively for a year now, but I still manage to shoot myself in the foot every now and then when using reactive state. Some of the confusion is due to my prior experience with React, but some points are confusing on their own. Today, I dive into svelte internals to understand what's really going on.

1. When you mutate svelte object state, do you really mutate the JS object?
2. Why doesn't `array.push` trigger an update?
3. How are $-dependencies determined?
4. Does setting a variable to its current value trigger an update?
5. Does a block using one object field, `state.field`, only run on changes to this field?
6. Why do $-variables behave a bit weirdly under JS scoping rules?

We won't talk about stores too much, we still have a lot to discuss before we get there. If you're in a hurry, here's a customary cheat-sheet:

![](/images/svelte-state.png?invert)

Let's go!

## Object state is mutable

One thing that caught me off guard, coming from react, is that object state is mutable — the exact object defined as the initial value will stay there as long as you don't reassign the variable:

```jsx
// data is always the same object
let data = {
    active: 0
};
const toggle = () => data.active = !data.active;

<button on:click={toggle}>
    {data.active ? 'on' : 'off'}
</button>
```

See [repl.](https://svelte.dev/repl/ef02a9c7eb26402da23949ac7740f3f4?version=3.58.0) By the way, this behavior also [applies to stores.](https://svelte.dev/repl/cef41b6a93494468824a2ce53cb5338e?version=3.58.0) This is in contrast to react, where most optimizations rely on "purity" — a thing is only considered changed if its reference changes.

So, svelte state is not an _observable object_ built by JS means, but a regular JS variable with an _update event bus_ attached separately. So far so good — the svelte way is close to how JS works. But what actually triggers the update event?

## Updates are triggered by assignment operator

The big selling point of svelte is its concise syntax. As a [showcase example,](https://svelte.dev/repl/758ed96027a74bd68a8e8347ed799401?version=3.58.0) you often see what looks like simple JS, but changing the variable magically updates the component:

```jsx
let isOn = 0;

<button on:click={() => isOn = !isOn}>
    {isOn ? 'on' : 'off'}
</button>
```

The magic disappears once you get to mutable objects — calling `array.push()` or any other mutating method [does not trigger an update:](https://svelte.dev/repl/1b7494f2e05b490fad957931cbd3d429?version=3.58.0)

```js
let items = [];
function addItem(text) {
    items.push(text);
}

{items.join(' ')}
<button on:click={() => addItem('hehe')}>
    more!
</button>
```

This seems very familiar to react developers — of course, mutating the object does not change its reference, so further updates are skipped! To add to the confusion, react-style immutable update like `items = [...items, text]` [fixes](https://svelte.dev/repl/3c710b40fec742dc88f22bb7d351459e?version=3.58.0) the problem. However, svelte state is mutable, and the real issue is the lack of an assignment operator which _actually_ triggers the update, so the weird self-assignment pattern [works just as well:](https://svelte.dev/repl/4f4272b255f9475d9bb138e4b013acc2?version=3.58.0)

```js
let items = [];
function addItem(text) {
    items.push(text);
    // #enable_magic
    items = items;
}
```

Any flavor of assignment operator (`+=`, `++`, and so on) works, but it must be present for the update to happen. Another thing to note is that update logic is dynamic, not a strict "if callback X runs, fire listeners to variable Y" rule. The assignments are compiled to a call like `$$invalidate(0, items)`, so conditional assignment only triggers updates if it's executed:

```js
// only triggers an update if text is truthy
function addItem(text) {
    if (text) {
        items = [...items, text];
    }
}
// always triggers an update
function addItemAlways(text) {
    items = text ? [...items, text] : items;
}
```

## Dependencies are determined statically

Unlike invalidation, which happens dynamically at runtime, $-blocks dependencies are determined statically at compile-time. If you have some logic that _only_ depends on `text` _if_ `isTracking` is true...

```js
let isTracking = false;
let text = '';
$: if (isTracking) {
    console.log(text);
}
```

...the block runs on every `text` change regardless of `isTracking` value, because both referenced variables, `text` and `isTracking`, are recognized as the block dependencies. This is in contrast to runtime reactivity, as seen in MobX — there's no way to even see the dependency on `text` if the code accessing it does not run.

One _inconvenient_ side-effect of this dependency detection mechanism is the lack of visibility into implicit function dependencies. Say you have this code:

```js
let items = ['hello', '', 'friend'];
const getNonempty = () => items.filter(x => !!x);
$: nonempty = getNonempty();
```

Since the $-expression defining `nonempty` does not explicitly mention `items`, it [_will not_ run](https://svelte.dev/repl/9ce86a7fc0de420d8886f509091d2620?version=3.58.0) on `items` change. Fix: avoid functions in $-blocks, or make sure they're pure (only depend on their arguments), or (worst case) make the function itself derived: `$: getNonempty = ...`

## Primitive updates are pure

Based on the points above, you'd assume that assigning to the variable _always_ triggers an update, but that's not the case. When repeatedly setting a variable to `true`, only the first change [results in an update:](https://svelte.dev/repl/5ad19198c21642678e70a283f8bbdfef?version=3.58.0)

```jsx
let isEnabled = false;
// only run on the first click
afterUpdate(() => console.log('updated'));
$: console.log({ isEnabled });

<button on:click={() => isEnabled = true}>
    {isEnabled ? 'clicked' : 'click me'}
</button>
```

In general, setting a primitive variable to its current value does not trigger an update. Here's the [svelte code](https://svelte.dev/repl/5ad19198c21642678e70a283f8bbdfef?version=3.58.0) that implements this optimization. 

## Object updates are _not_ pure

But in that case, how on earth can this support object mutation and self-assignment that don't change the object reference? Well, the trick is simple — it doesn't. Wrapping `isEnabled` with an object removes the optimization, and now the update [happens on every click:](https://svelte.dev/repl/06962949791c4e1897bbb41714d71385?version=3.58.0)

```jsx
let state = { isEnabled: false };
// runs on every click
afterUpdate(() => console.log('updated'));
$: console.log(state.isEnabled)

<button on:click={() => state.isEnabled = true}>
    {state.isEnabled ? 'clicked' : 'click me'}
</button>
```

The [code implementing the comparison](https://github.com/sveltejs/svelte/blob/6ba2f722518b3fb6904d6d566c3c1a00d61fe70a/src/runtime/internal/utils.ts#L41) always says "it's changed" when it sees an object.

## Reactivity is variable-grained

As we've just seen, object state is always treated as a whole — there is no _field-level reactivity._ If you have an $-block that only depends on a single field of the object, it [will run on _any_ change to the object:](https://svelte.dev/repl/689900fc527b41a79ed9e9efba9c93ed?version=3.58.0)

```jsx
const fields = {
    clicks: 0,
    name: ''
};
// runs on every "clicks" change
$: console.log(fields.name);

<button on:click={() => fields.clicks++}>
    clicks: {fields.clicks}
</button>
<input bind:value={fields.name} />
```

If we only want the $-block to run on actual `name` change, we can achieve that by extracting `name` to a separate reactive variable. This variable will have its own "change event", independent of other object fields. In our example it's better to just define the fields as separate variables from the start, but in general this can be done [using a _$-variable:_](https://svelte.dev/repl/a69f93746691429f8581cb16510a59ed?version=3.58.0)

```jsx
const fields = {
    clicks: 0,
    name: ''
};
// uses primitive comparison under the hood:
$: name = fields.name
// runs on "name" change only
$: console.log(name);

<button on:click={() => fields.clicks++}>
    clicks: {fields.clicks}
</button>
<input bind:value={fields.name} />
```

Note that object-to-object mapping does not optimize anything and just [runs on every dependency change.](https://svelte.dev/repl/515680f84f8642108f8678a9f1bbfe29?version=3.58.0) This is because the "pure" optimization is only applied when all dependencies are primitive (computation is not triggered), or the output is primitive (further dependencies are not triggered).

## $-variables are an illusion

If you've spent some time moving $-variables around, you know they behave weirdly from JS scoping perspective:

1. You can reference the "scope" variables (declared with let / const) declared _after_ the $-expression (in normal JS, this is TDZ)
2. You can access $-variable anywhere in the script, but the value outside $-blocks is `undefined`

Here's an example to illustrate this behavior:

```js
// you can reference variables before they're declared
$: name = state.name;
let state = {
    name: ''
};
// logs "undefined"
console.log(name);
```

The trick is, again, simple — $-variables are just sugar over a simple let declaration and an $-block that assigns to the variable. The variable declaration is hoisted to the top (which is funny, because this perfectly emulates a `var` declaration), and $-blocks become callbacks defined _after_ the synchronous initialization code. The un-sugared equivalent of the code above will be:

```js
// hoisted let declaration
let name;
// init block
let state = {
    name: ''
};
console.log(name);
// $-blocks
$: {
    name = state.name;
}
```

If you want to go one level down, the output in both cases is:

```js
let name;
let state = { name: '' };

console.log(name);

$$self.$$.update = () => {
    if ($$self.$$.dirty & /*state*/ 1) {
        // you can reference variables before they're declared
        $: name = state.name;
    }
};
```

One funny side effect of this is that you can _assign_ to the $-variable from e.g. another $-block, or a callback. The variable is not strongly bound to its definition, the last assignment wins. This would be quite confusing, though, and I recommend against such trickery.

---

To summarize, here's the result of my research:

1. Svelte object state is truly mutable. "Reactive variables" are just regular JS variables with change event bus attached as a sidecar.
2. Updates are only triggered by assigning to reactive variables — assignment is compiled to `$$invalidate(var_index, value)` call.
3. Reactive block dependencies are determined at compile-time based on variables used inside the block.
4. "Pure" optimization only applies to primitive values.
6. Variable is the smallest unit of reactivity — changing a single object field triggers all the blocks using this object.
7. $-variables are compiled to a hoisted let declaration and a callback called after the setup code.

Hope you've learnt something useful today — I sure have. Next time, we'll dissect svelte stores — [follow me on twitter](https://twitter.com/thoughtspile) to stay updated!
