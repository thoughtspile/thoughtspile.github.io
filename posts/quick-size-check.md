---
title: Zero-setup bundle size checker
date: 2021-09-24 21:07:28
tags:
    - infra
    - frontend
---


We all love keeping bundle size under control. There are many great tools that help you with that — [webpack-bundle-analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer), [bundlesize](https://github.com/siddharthkp/bundlesize), [size-limit](https://github.com/ai/size-limit), what not. But sometimes you you're lazy, or you're stuck choosing the tool, or the project is too small to justify spending extra time. Don't worry, I'll show you a way to check bundle size without a single extra dependency on mac and linux!

### Raw bundle size

To view the raw JS bundle size, just build your app (say, `npm run build`), and then (assuming your built files are in `./dist`) run this snippet:

```sh
wc -c dist/**/*.js
```

`wc` (short for Word Count) is a shell command that counts words in a file. Since we care about byte size, not words, we use the `-c` flag. Don't ask me why it's `c`, maybe for Char? Anyways, this gizes us the byte size of every generated JS file, as well as the total size, in a nice table:

![](/images/raw-bundle-size.png)

You can change the asset extension like `dist/**/*.css`, or view the total asset size by omitting the extension altogether. This won't give you a breakdown by entrypoints or any idea _why_ the size is what it is, but hey, you spent like 3 seconds on it!

You could try `du -sh dist/**/*.js` — it shows you _some_ sizes of your assets, too. Those sizes are rounded up to the nearest FS page (or whatever it's called, my systems programming is rusty) — 4K in my case. 4K is not much, but `wc -c` is more precise.

### gzip size

But your assets are compressed, aren't they? No propblem, shell can `gzip` for us:

```sh
gzip -c dist/**/*.js | wc -c
```

Here, we `gzip` every JS file and concatenate them together, `-c` writes the result to stdout, then `wc -c` counts the bytes of `gzip`ped data. You can also adjust compression level using `gzip -[1..9]`, but that doesn't drastically change the result.

Viewing the sizes of individual JS files is a touch more complicated:

```sh
gzip -k dist/**
wc -c dist/**/*.js.gz
```

Here, we gzip all the assets and actually write them to disk (`-k` makes sure the original files are not deleted), then `wc -c` them (`.gz` is appended to every filename) as usual.

![](/images/gzip-size.png)

You could also `cat dist/**/*.js | gzip -c` — this compresses the JS files as one huge file. If you have several JS files, this would probably be smaller that per-file gzip. You can use this to see how much you would save by bundling all your code together.

---

To check bundle size of any project, build it and use these 2 commands:

- `wc -c dist/**/*.js` shows you byte sizes of all your JS files
- `gzip -c dist/**/*.js | wc -c` shows you the total bundle size of your JS files after gzip (what would be transfered over the network)

Happy optimization!
