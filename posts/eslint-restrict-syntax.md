---
title: Become the master of your eslint with no-restricted-syntax
tags:
    - eslint
    - infra
    - programming
    - javascript
date: 2021-06-02 15:07:58
---


The other day I was doing my normal thing trying to force `import '*.css'` to be the last import in a file, which ensures a predicatbale CSS order. I spent hours looking for a eslint plugin to do that, but with little luck. Without getting into too much details:

- The [built-in `sort-imports`](https://eslint.org/docs/rules/sort-imports) can only group by syntax (eg `import { a, b }` before `import def`) — weird.
- [`eslint-plugin-import/order`](https://github.com/benmosher/eslint-plugin-import/blob/master/docs/rules/order.md) has a more useful grouping, but ignores side-effect imports (just like out `import '*.css'`).
- The amazing [`eslint-plugin-simple-import-sort`](https://github.com/lydell/eslint-plugin-simple-import-sort/) is tweakable enough to detect CSS imports, but also forces alphabetic order on all other imports.

I got entrenched in an argument about alphabetizing imports, so the issue was swept under the rug for a while. Just as I was about to write a custom plugin, the help arrived in the form of [`no-restricted-syntax` — an amazing eslint rule](https://eslint.org/docs/rules/no-restricted-syntax) that allows you to enforce almost anything, including my CSS import ordering. It lets you describe the code you don't want using ESQuery, a CSS-selector-like query language for ES AST. Sounds fancy and complicated, but if you know CSS (as a front-end developer, you probably do), you quickly get the hang of it.

Let's walk through an example, forcing CSS imports to be last:

1. `ImportDeclaration` matches the AST node for `import ...;`. A good start, but too loose.
2. To be more specific, we match only imports of files with `.css` extension using the amazing regex attribute selector: `ImportDeclaration[source.value=/\\.css$/]` Much better, but we don't want to ban all CSS imports.
3. Finally, we can find (watch closely) imports following a CSS import with general sibling selector `ImportDeclaration[source.value=/\\.css$/i] ~ ImportDeclaration[source.value!=/\\.css$/i]` and ban them!

All in all, we end up with

```json
"no-restricted-syntax": ["error", [{
    "selector": "ImportDeclaration[source.value=/\\.css$/i] ~ ImportDeclaration[source.value!=/\\.css$/i]",
    "message": "CSS import must be last"
}]
```

The warning is shown on imports following the CSS import, not the CSS import itself. Not ideal, but it's is a tradeoff you have to make since ESQuery selectors can't look ahead in the tree, just like CSS. On a bright note, you can use the dope [CSS4 `:has` selector,](https://drafts.csswg.org/selectors-4/#has-pseudo) which is not supported in any browser yet.

Two resources I find helpful when working with `no-restricted-syntax` are:

- [Esprima demo](https://esprima.org/demo/parse.html) prints the AST for a JS snippet you provide. Very handy to see what node types and attributes the AST has.
- [ESQuery docs](https://github.com/estools/esquery) describe the supported AST selectors with links to their CSS counterparts. There's also a [live playground](https://estools.github.io/esquery/) that lets you try the selectors in a browser, but it doesn't work that great.

More and more often I find that writing a quick query for `no-restricted-syntax` is faster and simpler than looking for a plugin that does what you want, and then configuring it. Hell, it's even easier than trying to recall the name of a built-in rule that you know exists.

Even when a rule _is_ available and you remember the name, `no-restricted-syntax` may offer some benefits:

- More maintainable, as in `MemberExpression[property.name=/^(add|remove)EventListener$/]` vs [`no-restricted-properties`](https://eslint.org/docs/rules/no-restricted-properties) with several copies of the rule to ban explicit `addEventListener` and `removeEventListener`.
- More flexible, as in `MemberExpression[property.name=/^(add|remove)EventListener$/][object.name!=/^(document|window)$/]` that _only_ allows explicit listeners on `document` and `window`.

As with anything, there are some weaker points:

- ESQuery (and regexes) do have a learning curve, and other team members may struggle with editing the rules.
- Autofix is clearly not available.
- You can't disable a specific restriction per line with `/* eslint-disable */`, only the whole rule.
- A minor inconvenience (or my stupidity), but I could not get slashes in regex attribute matchers to work no matter how much I escaped them (and I went all the way from `/` to `\\\\/`).

---

Overall, `no-restricted-syntax` is a very cool rule. It covers probably 95% of the cases where you might want a custom eslint plugin. If you ever wanted to ban some pretty specific thing, but abandoned that idea after a fruitless search for a fitting eslint plugin, it might be your turn to give it a shot!

ESQuery is not almighty — you still can't match across multiple modules or maintain a complex context. Is it time to write a plugin for that? Probably not — stay tuned for my next post on working around eslint limitations!
