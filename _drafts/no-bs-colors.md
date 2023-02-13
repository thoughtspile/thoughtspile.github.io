---
title: Zero-bullshit guide to making your own color schemes
tags:
  - design
  - frontend
date: 2023-02-05
---

Today I wanted to talk a bit about color schemes. Designers often make it seem hard — harder than it really is. 

What makes me qualified to talk about color schemes, if I'm not even a designer? Well, I might not be one, but I spent 7 years in front-end development, of which for two years I worked exclusively on large design systems. I met some pretty badass designers who could actually

Now, am I gonna tell you to ditch the designers and just design palettes for every project yourself? Of course not. But even if you get the color scheme from your designer, it pays off to understand what you're dealing with.

## The base

I won't surprise anyone by saying most websites have contain some text over a background (the text can't just hang in the air ya know). You can have a website that's mostly long text (blogs, landing pages, company websites), or a web app where text comes in small chunks, but in any case text is important. The colors you use for text form the _base_ of your color scheme.

Let's start with a decent default — #000 black text on #fff white background. The first goal of your text is to be legible, and you can't get any more contrast than this. In fact, many designers think this is too much contrast that puts too much strain on your users' eyes, opting for dark-grey text, or a pale-grey background, or both. It's a decent idea, but don't push too hard, or you end up low-contrast text that's impossible to read.

In addition to the normal text your users will actually read, you'll have some _supplementary_ stuff — article tags, labels, what not. To make this text less prominent than

Secondary BG

These four colors already do a decent job of presenting information _without_ making your design look like a parrot. It's not the most adventurous presentation, but I never promised adventurous, I promised zero-BS. If you really want to go there, you _might_ add some hue to your base, like a dark-(almost-black-)blue text on (super-)pale-blue, but this is harder than it seems, and causes problems down the road.

But if we can de-prioritize certain elements using secondary color, shouldn't we have a way to _prioritize_ other stuff? And that we'll do.

## The accent

Now that we have a decent base, it's time to finally add some color. Not only because it's nice and fun (it is), but for entirely practical reasons.

First off, you need to make some text stand out — maybe because it's important, maybe because it's not really text but an interactive element like a link. 

Then, apart from the text, many websites have buttons. Moreover, buttons are often _the_ element you want your user to interact with — call-to-action, like "buy" or "subscribe". So, it makes sense to attract attention to the button, but also make it look like a button, with a background. Black does not work that well as a background color because it's _too_ noticeable and distracting, grey looks disabled, white-on-white is not a backgrond because you can't see it. All of it makes accent color a good choice for button background.

What color should you choose as the accent? Surprise — almost any hue works, because _any_ splash of color stand out from a black-and-white base palette, and _any_ color nicely pairs with black-and-white. Colorized base complicates the task, because now you can get pretty disgusting pairings (remember I told you to beware?).

Pick something that's dark enough to be legible as a text, but not grey-ish, because it will look disabled. For interactive accent-colored elements, you'll need two extra colors: a darker one (more noticeable) for hover, and a lighter one for disabled elements. All in all, this leaves us with 6 colors: 3 base, 3 accent.

If you think having a simple color is boring, grab a pack of swiss design aka international typographic style images: https://www.pinterest.com/jonathanelee/swiss-style/

The most traditional accent color is red, often used in traditional calligraphy (_both_ european and chinese) and modernist design. But the safest and most usual choice for accent color is blue — as we'll see, not without reason.

## Semantic colors

## 

You might recall we've done  Allowing disabled elements (buttons, inputs, etc) 

---

All together now!
