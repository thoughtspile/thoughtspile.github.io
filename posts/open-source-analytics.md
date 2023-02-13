---
title: 'Ditch google analytics now: 7 open-source alternatives'
date: 2023-02-12
tags: 
  - programming
  - webdev
  - open source
---

I love writing, and I also love _data._ When starting my blog, I integrated Google Analytics — it's free, easy to set up (just drop a few tags on the page), and that's what I knew back then. I did not _enjoy_ it being run by a big corporation, but I was too lazy to research the alternatives, and then pay for them. But when Google announced [sunsetting the current generation of analytics,](https://support.google.com/analytics/answer/11583528) and I had to take some action at any rate, I decided to pull the trigger and make a jump to an open-source alternative.

My analytics needs are quite simple, really: 

- See how many people read my articles, along with basic stats like session depth and duraiton, because this makes me feel good.
- Filter by source to see which places work better for sharing my content. 
- Custom events, so that I see how design changes help me grow an audience (_and_ this works as a cheap JS error tracker).
- Data export would be nice — sometimes I play around with it in pandas.

In this article, I give compelling reasons to switch to self-hosted analytics. I share my research on seven open-source analytics tools so that you don't have to do it yourself. Then, I provide a quick tutorial to get up and running with [plausible.](https://plausible.io/) Whether you're still on google analytics (or a comparable corporate tool like [Meta pixel](https://www.facebook.com/business/tools/meta-pixel) or [Yandex metrica](https://metrica.yandex.com/about?)), or just considering adding analytics to your website, this will get you up and running in no time.

## Why self-host your web analytics

I know that paying (either by subscribing to a paid hosted version or maintaining your own infrastructure) for something you can get for free needs justification. And in case on web analytics, you do get decent benefits for your buck:

- Privacy — we all know google eats user data for breakfast, lunch and dinner. You "pay" for google analytics with your users' data. The tools we're discussing do _not_ come from companies that run the internet, and don't have the same data collection motivation, so you do protect your user privacy by switching. You _might_ argue "I like programming" is not the most private information, so let's move on to the less _moral_ and more _practical_ arguments.
- Better data. Google analytics are blocked by most adblock tools, leaving you with incomplete data — [some research](https://towardsdatascience.com/how-much-data-is-missing-from-your-google-analytics-dashboard-20506b26e6d) suggesting figures around 43%. Switching to a less intrusive alternative gives you back the missing data, and more data means better insights with less effort.
- Fuck big tech. My blog was basically excluded from google search in october 2022 for no reason, and I want revenge. Depriving google of my users' data is like a microbe bite, but it does feel good.

While not directly related to self-hosting or open source, most of the tools we discuss have extra desirable treats:

- No cookies, so I don't have to worry about GDPR banners or whatever (even though [some disagree](https://github.com/plausible/analytics/discussions/1963)). To be fair, I'm not 100% sure you absolutely need a banner whenever you have any cookie, but I'm not a lawyer and no cookies sounds like no problems to me.
- Simpler interface. This _does_ sound like a made-up justification for limited functionality, but I honestly see this as a win for a casual analytics user like myself.
- Smaller JS footprint = better website performance. Google Analytics is famously around 50KB / 21KB gzip of JS, while most tools we discuss have scripts under 2KB. It's not a _huge_ deal, as a tracking script does not block anything and is cached, but a pleasant bonus. In theory, this lets you catch a few events that occurr soon after the first page load.

Now, is self-hosting the anallytics worth the trouble of setting up and maintaing the infrastructure? I think the answer is yes, and here's why:

- Yet more privacy. When sending your user data to _any_ third party, you're counting on their good will. If your data goes to your own server, it just stays there. If you're extra paranoid, you can ban outgoing traffic from the analytics container, or implement any other security measures.
- Yet better data collection. Some privacy protection tools do restrict connections to well-known analytics hosts. Sending data to your own domain makes blocking your tracker much harder, because a domain blacklist won't cut it any more.
- Price. As we'll see, you can self-host analytics for around 6$ a month, which is cheaper than the paid analytics services I've seen, and this price will _not_ auto-escalate if you suddenly have a traffic spike.
- Data ownership. Your historic data lives on your server, and you're free to export it regardless of any decisions the maintainers of the tools make. Not _every_ tool on our list has easy export, but nothing stops you from a DB dump in the worst case.
- No vendor lock-in. With your data available, you can (in theory) migrate to any other analytics service if you change your mind. Again, not all the tools can _import_ data, but some can.
- Future-proof. The company developing your tool of choice goes out of business, switches to closed-source, or makes a big update that requires you to reconfigure everyting from scratch? No worries, you can just stay on your current version as long as you please.

This should be enough to convince even the most skeptical readers that self-hosted analytics instance is worth it. Now, what tools are available for the job, and which one should you pick?

## Open-source web analytics tools, an overview

When it comes to open-source analytics tools, we have three top-tier choices: matomo, plausible and umami.

[Matomo](https://matomo.org/) is the most established tool in the game (been doing it since 2011). I have personally seen it used by huge compaines, and people were pleased with it (it was called piwik back then). It's the closest alternative to google analytics in terms of features — you get customizable dashboards, integrations (ecommerce, website builders, multiple search providers), alerts, plugins, exports and what not. It even has iOS / android SDKs. But the truth is, I don't need all these extra features, I don't want to pay for it (in terms of a larger tracking script and more complex dashboards) and I'd be perfectly happy with something simpler, which brings us to...

[Plausible](https://plausible.io/), in contrast, offers a stripped-down analytics experience with only the essential metrics — page views, bounce. duration, source, device, location by default. It's cookie-free and features a tiny script (claims to be "< 1KB", but it's 1.6KB on my page). Any custom events can be sent via JS API. The docs are top notch, the docker set-up is straightforward, and you can import and export CSV data as you please. I'm loving the feature set, and this is what I ultimately went with. One valid criticism of plausible is that it's slightly convoluted, featuring two databases and an elixir server, which makes it pretty hard to set up without docker, but I don't mind it.

[Umami](http://umami.is/) is another "simple analytics" tool. I find it _extremely_ similar to plausible — same minimal dashboard, same cookie-free tracking, same tiny script (1.6KB gzip). It launched in 2020 with great hype, but plausible quickly caught up. As of 2023, umami still lacks [data import from GA,](https://github.com/umami-software/umami/discussions/1085) and [only supports export via DB dump](https://github.com/umami-software/umami/issues/310) — plausible can do both easily. I also prefer plausible docs. Umami has only one DB, and [can run as a raw node service.](https://www.reddit.com/r/selfhosted/comments/o8r293/comment/h374uqf/?utm_source=share&utm_medium=web2x&context=3) Overall, it's a viable choice, and competition is always good.

For historical reference, [fathom](https://usefathom.com/) was among the first privacy-focued trackers. It has since re-launched as a paid product, freezing development on the [open-source version](https://github.com/usefathom/fathom). The fact that you can still install and use it demonstrates my point on "suture-proofness" in action. I'd prefer something that's actively devloped, and I see no reason to pick it over the tools mentioned above.

Among the lesser-known tools I found these three to stand out from the competition:

- [Offen](https://www.offen.dev/) (dope landing page design!) is built around "fairness". Your visitors must give _explicit consent_ to data collection, and can view or delete their data at any time. On the practical side, it comes with auto-renewing SSL out of the box, which is nice. I'm not against _consent,_ but I have personally developed _popup blindness,_ and I'm afraid the users will just scroll with the banner hanging around. Sadly, it can't track custom events (clicks, forms, etc) as of 2023, and has no import / export (presumably by design).
- [Goatcounter](https://www.goatcounter.com/) can run without JS via a tracking pixel (but comes with full JS version, too). Extras: CSV export, API access, good docs, signle-binary deploy, and the name is quite funny. You might say the UI is dated, but I'd call it _hacker-themed._
- [Ackee](https://ackee.electerious.com) comes with [extra anonymization](https://docs.ackee.electerious.com/#/docs/Anonymization) and features a [GraphQL API](https://docs.ackee.electerious.com/#/docs/API) that allows you to import / export data as needed and build custom integrations or dashboards.

Then, of course, you can just take a generic log analyzer (grafana, graylog, goaccess) and throw any data you wish there. You get more flexibility, but there are no precofigured views for common web stats, and you must write the actual tracking logic (both JS and the endpoint) yourself. We track product metrics via a log aggregator at work as it lets us trace problems to back-end issues, but I wouldn't take this path for a simple website.

Ultimately, I picked plausible because of its minimal approach, complete feature set (mainly data import / export) and great docs. However, all the tools on my list have their strenghts, and you can pick whichver you prefer, or even try a few before commiting. Here's a flowchart with _some_ things that might influence your decision:

![](/images/self-hosted-analytics/alternatives.png?invert)

## Up and running

Before we get started, you'll most certainly need two pieces of infrastructure:

1. A _server_ — fair enough, you need a hosting to self-host anything. I use an entry-level [linode](https://www.linode.com/pricing/#compute-shared) for $5 a month, which is a typical price. With your average blog traffic this leaves room for other services — [OpenVPN server,](https://hub.docker.com/r/kylemanna/openvpn) [Gitea](https://docs.gitea.io/en-us/) or whatever you wish.
2. A custom _domain name._ GitHub can't proxy _some_ traffic from `username.github.io` to your analytics server, and HTTPS won't work on a raw server IP without a domain name. You can get one starting at $5 a year (more for a decent TLD, make it $20). I heard [porkbun](https://porkbun.com/) suggested. You are not obliged to use this domain for your website (even though [GH pages support that](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)), so something shady like `fk12sdj1244.cyou` works if you wish.

With that in place, we can set up our plausible instance. I'll make it quick, since there already is a [tutorial by Mansoor,](https://esc.sh/blog/plausible-analytics-selfhosting/) and the docs do a decent job:

1. [Install docker.](https://docs.docker.com/engine/install/ubuntu/)
2. Start plausible: clone the repo, edit config, and `docker-compose up -d` the service (see [docs](https://plausible.io/docs/self-hosting)). If this worked, you can access the UI at `http://your.ip.1.1:8000`
3. You can't send analytics from your HTTPS website to an HTTP endpoint, so there's more work.
4. Go to your DNS settings, come up with an analytics subdoiain (like `an.you.io`) and add server IP to the relevant A/AAAA record. Plausible _can not_ live on a `/path`, it needs its own subdomain. Success = the UI is live on `http://an.you.io:8000`
5. Now we need a reverse proxy for SSL termination. I went for a full-dockerized setup with [nginx-proxy](https://github.com/nginx-proxy/nginx-proxy) container. Set `VIRTUAL_HOST` in `plausible-conf` to enable discovery, append `nginx-proxy` to `docker-compose.yml`, restart, and you should be able to access analytics at `http://an.you.io`. Un-exposing the port 8000 at this point won't hurt.
7. Now, the actual SSL certificates. nginx-proxy has an [acme-companion](https://github.com/nginx-proxy/acme-companion) container that manages letsencrypt certificates for you. Add it to your `docker-compose.yml` along with all the extra volume declaraions, and you're all set — `https://an.you.io`
8. It's time to add `https://an.you.io/js/script.js` script to your website and watch the data flow.
9. The most painful step is importing historical data from google analytics (thanks google, it _is_ possible). Here are [the docs](https://plausible.io/docs/google-analytics-import) to help you. Took me an hour of Google Cloud and SSO suffering, but it all worked out fine.

Et voila, you're self-hosting your analytics. No need to involve google nay more. The same process applies to any dockerized setup with minor adjustments, not just plausible.

---

Self-hosting your website analytics comes at a cost — to be precise, around $7 a month for hosting and the domain, but you can use the same infrastructure for other tasks _and_ you get quite a few benefits in doing so:

1. User privacy — no data sent to any third parties.
2. Less missing data — your own domain is unlikely to be adblocked.
3. Data ownership — you can always export historic data and move to another tool (worst case — via SQL dump).
4. Future-proofness — even if the developer goes out of business, your instance stays with you.
5. Price (when compared to hosted alternatives) — you can easily run analytics for under $7/mo, including a custom domain, while hosted solutions start at $9.
6. Most importantly, it's one small step that we, as a content creators, can take to make a dent in corporate monopoly.

Most privacy-focused analytics tools also feature no cookies (aka fewer legal concerns, but not like in legal advice etc.), simpler interface, and smaller tracking JS (both at the expense of less data).

We examined seven open-source analytics tools that you can self-host. Here they are, in order of my preference:

1. [Plausible](https://plausible.io/) is a minimal analytics solution with _enough_ features for me: custom events, API, GA import, CSV export. Great docs!
2. [Umami](http://umami.is/) is very similar to plausible. I prefer import / export and docs on plausible, but umami has slightly better mobile UX. Close call.
4. [Goatcounter](https://www.goatcounter.com/) is a _hacker-style_ tracker. Runs as a single binary, supports no-JS tracking via pixels or log imports. UI choices are divisive.
3. [Matomo](https://matomo.org/) is a well-established platform with lost and lots of features you probably don't need.
5. [Ackee](https://ackee.electerious.com) comes with a GraphQL API and nice UI.
6. [Offen](https://www.offen.dev/) is _conceptual:_ it requires explicit consent, and users can view their data. How well this works in practice remains to be seen. Some features are missing — most importantly, custom event tracking.
7. [Fathom](https://usefathom.com/) is not bad, but I can't recommend it since the development of free version has been shut down.

Finally, I showed you how to install and integrate your own plausible instance, along with HTTPS.

Now it's your turn to self-host your analytics and say good-bye to google.
