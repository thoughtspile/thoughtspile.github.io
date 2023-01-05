---
title: Is your babel's transform-runtime getting lazy? You better check.
tags:
  - babel
  - javascript
  - infra
date: 2021-10-06
---


IE11 is not dead yet, and our library is supposed to run there and make russian grandmas happy. As you can guess, we rely on babel's [preset-env](https://babeljs.io/docs/en/babel-preset-env) a lot. We also don't want our code to be 55% babel helpers, so we use babel's [transform-runtime](https://babeljs.io/docs/en/babel-plugin-transform-runtime) — it should make babel `import someHelper from '@babel/runtime/some-helper'` instead of inlining it into every file. After making some build chain updates I went to see if the transpiled version was OK. And guess what I noticed? Some babel helpers were still there, inlined:

```js
import _defineProperty from "@babel/runtime/helpers/defineProperty";
// go away transform do you have any idea who I am?
function ownKeys(object, enumerableOnly) { /* blah-blah-blah */ }
function _objectSpread(target) { /* more blah-blah-blah */ }

var copy = function copy(obj) {
  return _objectSpread({}, options);
};
```

WTF? I want to `import _objectSpread`, you lazy code! What's wrong with you? A leak from an external library? An unexpected interaction with `preset-react` or `preset-typescript`? Corrupt installation? Babel bugs? No, no, no, no.

![](/images/sherlock.jpg)

The answer was simple — transform-runtime wants me to tell it what `@babel/runtime` version I have via [the `version` option](`@babel/runtime`). For some reason, transform-runtime assumes you have `@babel/runtime` version `7.0.0`, and if a helper was not in `runtime@7.0.0`, it won't bother importing it. Babel is at `7.15.x` now, and a lot has changed. Anyways, if you pass the real runtime version you installed:

```js
exports = {
  "plugins": [
    ["@babel/plugin-transform-runtime", {
      // this is the magic line
      "version": "7.15.0"
    }]
  ]
}
```

`transform-runtime` will finally do its job as it should:

```js
import _objectSpread from "@babel/runtime/helpers/objectSpread2";
var copy = _objectSpread({}, props);
```

If you'd rather do it once, use `babel.config.js` and read the runtime version from `package.json` — both your dependency range and the version in node_modules work fine, though I feel the latter is cleaner:

```js
// in babel.config.js
const requiredVersion = require('./package.json').dependencies['@babel/runtime'];
const installedVersion = require('@babel/runtime/package.json').version;
```

---

If you want your `@babel/plugin-transform-runtime` not to get lazy and really deduplicate all the helpers, set transform-runtime's `version` option to the current `@babel/runtime` version. Also keep your babel stack updated, and try to match `@babel/*` versions. You're welcome.
