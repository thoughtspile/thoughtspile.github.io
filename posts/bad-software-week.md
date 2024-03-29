---
title: Another Week with Bad Software
tags:
  - rant
  - life
  - thoughtspile
  - programming
  - depression
date: 2018-09-23
---


In the midst of my September job hop I headed to Kazan for the weekend. I don't know exactly why — probably because I could. I had a hotel booked via booking.com, but once I arrived there the receptionist told me it was the first time he's heard of my booking, and he told me that they had no more rooms, and he told me that I'd rather find another place to stay.

But why, I always see these things for what they are. Some sneaky caffeinated programmer kids at work with the booking system integrations, you should always double-check after us! After what came next, I started suspecting there's some particularly defective developer marketing himself as a _"Chief Hotel Booking Management System (HBMS) Professional with 10+ years experience in the field"_.

![](/images/kazan-bridge.jpg)

I booked the next hotel for the two nights, with a discount, and walked there. Guess what? The room I booked was occupied, but they had another one, but not for two night, just one. In the end it worked out all right because there was that woman using the responsive, fully interactive, enterprise-ready ERP system "sheet of paper and a pencil" that allows you to reschedule bookings at will, with no programmers involved.

The rest of my trip went well, probably because I had little interaction with software stuff. The pizza place charged me twice, because they thought the first payment didn't pass, but they gave the money back. Human problem, wasn't it? (Of course not completely, some usability failure out there, but let's leave it for what it is, shall we?)

## The Return

I was riding the train from the airport, almost eager to get back to work writing things that mostly function. I was a bit worried they didn't give me a call — was I supposed to just come to the office and figure out what to do next? Anyways, I made some calls and found out that the information about me starting my work got lost somewhere along the course of a month it's been running around the infrastructure.

This got me a little worried: I haven't spent a week in Moscow without work in over three years, and, besides, I was running low on money. I wasn't angry with anyone in particular: who should I blame for the state of the industry? I'm just as guilty as anyone for letting it fall that low. it turned out not to be that bad after all: the weather was good, and I got a chance to walk the empty city — everyone here in Moscow is too busy working hard to be out of office in the middle of the day.

My accidental vacation started along the fanfare of Nikita Prokopov's [software disenchantment](http://tonsky.me/blog/disenchantment/). It's depressing but, and even more depressive for being true. Let me pick a quote for you:

> We cover shit with blankets just not to deal with it.

I've been subscribed to this blog for several years, and never knew the man was Russian. I should have guessed — where else can a man that depressed and dissatisfied with the state-of-the-world come from? The part that caught my attention was the Russian apps on the screenshots. From there I got onto Nikita's [russian-language blog](https://tonsky.livejournal.com/).

## Why must it be like this?

It's good the blog is in Russian — serves well to save the good people of the world from Moscow-grade sadness. Somewhere in the comments on the fourth page I found a neat explanation for why the things in software are the way they are. I can't find the particular comment any more, but I remember the gist and even spent some time elaborating on it.

Once a problem is solved by software at a minimum viable level, you don't need programmers (we are crazy expensive) to actually make it work. The solution gets canned and distributed in a bundle that usually works, as long as you're not getting too tricky:

- Edit a table of numbers? Excel!
- Write a text? Word!
- Send some data to another person? E-mail!
- Make a website? Wordpress!
- Edit an image? Photoshop!

The programmers are there to stick them into the holes of the abstraction. If you're generating excel tables programatically from a database, or want your website to synchronize with a price list from a Googledoc, you need some programmers to duct-tape the systems together in unexpected ways (I'm working hard to stay away from shit-based metaphors, but feel free to make one yourself). These systems have a long train of backwards compatibility, they are a massive overkill for the job, but hey, they work just well enough.

I'm enraged by the lack of attention to static website generators. The idea is beautiful: pipe some markdowns through a template, get a set of static HTMLs and resources that can be host anywhere for, like, free! Why do people make their websites in Wordpress — have a MySQL database at work pushing the limits of storing static data, and PHP, rendering the pages at every request. Oh dear, the system was supposed to write blogs — how did they ever manage to bend it into e-commerce, landing pages and ERP front-ends?

No, I do know the answer to that — just hit a freelance farm to find a bunch of schoolchildren who can make you something that looks like a website in a week, for $50. I wouldn't consider disrupting a business with that low profit margin — and who would?

## And also

On Thursday I was watching my TV when the electricity died. It spent the evening randomly switching it on and off, then got stuck loading forever. The philips tech support was very sympathetic. "There's some very high tech in there — a whole embedded system! How in the world did you expect it to survive the electricity shutdown?" they said. And yeah, sure, what did I expect from a system that had a piece of software in it?

<figure>
  <iframe style="margin: 0 auto; display: block; max-width: 100%" width="560" height="315" src="https://www.youtube.com/embed/-eREiQhBDIk?rel=0&amp;start=230" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
  <div style="text-align: center; color: #666">Here's what I (and Nikita, and even Uncle Bob lately) think of software</div>
</figure>

Really, I should assume I write code at least marginally better-than-average and get into programming education. There's a horrible shortage of material on learning actual programming (not "How to Use Technology X to Solve Problem Y"-style things) out there. I must to fight as well as I possibly can. You must, too (yes, you, the guy who actually read this all).

---

You've just seen a weekly snapshot of my thoughts pile. While taking another look at this website's design to see if the the navigation is obscure enough to prevent the users from noticing the other posts (it probably is; I don't think i'm changing it just yet) I noticed something horrible.

The blog's address has _thoughts pile_ in it. How is that name appropriate for the smart, boring and technical stuff I've come to post? I need to give the place some wildness it deserves. _Klyukovka, ay, igray Balalaechka!_ Writing messy speculative posts is far more entertaining!
