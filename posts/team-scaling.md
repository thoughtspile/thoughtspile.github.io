---
title: Growing my team 4x has been a pain. Can we do better?
date: 2024-04-18
tags:
  - career
  - management
  - tech
---

My name is Vladimir, and I'm an engineering manager of a team building a banking app. Following the success of our core banking product, we've decided to expand to other financial services. In the last four months my team has grown 4x, going from a 4-person team to 4 teams totalling 15 people. It was, frankly, a shitshow, and now I see many things we could have done better.

At first sight, increasing your team is a perfect way to speed up your product development. In practice, scaling is _very_ challenging. Today, I'll share the pains of growth we've ran into:

1. Disbalanced growth across functions.
2. Teams becoming _too large_ to manage.
3. Processes breaking down.
4. Mass onboarding challenges.
5. Seniority skew.

Now that it's all done, I can't say these problems were unexpected, or that our solutions have been incredibly inventive, but a first-hand account is worth writing down. Whether you're a leader expecting your team to scale, or just curious about the daily challenges of an engineering manager, hope you'll find something for yourself. Let's go!

## Scale evenly across functions

You lead a 5-man engineering team. You'd like to build 2x the stuff you're building. The obvious solution is to hire 5 more engineers. Problem solved? Not so fast.

Anything you build flows across several stages, each handled by a certain role, for example: product manager -> design -> engineering -> QA -> product analytics -> (back to) product manager. If you have a balanced flow with your current team, enlarging just the engineering will _not_ make you more productive:

1. Downstream functions (QA / analytics) can't keep up with the increased production — they must either put in overtime or downgrade quality standards.
2. Upstream functions (product / design) can't fill the backlog fast enough, and the eng team has nothing to focus on, either slacking or refactoring the refactorings.

With rapid growth, some temporary disbalances are unavoidable. It's fine to spend a few weeks or months in a disproportionate state, but overall aim for balanced scaling. Here are some tips to smooth the transition and even use the disbalance to your advantage:

- If you have any control over it, give product & design a hiring head-start. You can get their artifacts ready for development with a limited series of grooming meetings, and once the new engineers are on board, you'll have some great useful tasks to feed them.
- Catch up on your tech debt. Have too many engineers and not enough product tasks? Don't despair: use the time to clean up some old bugs, do the overdue refactorings, and prepare the codebase for the speed-up.
- Expand the area of responsibility. If you lack QA specialists, it might be time for the engineers to practice their testing skills. Oversized non-technical component (product / design) is more problematic, but you can give them some no-code tools to replace the eng team in some scenarios — e.g. build an admin UI where PM can edit the texts, create new banners, and so on, without involving your team.

## Update team structure

Say you have a normal-sized team (4–7 engineers) with your average meeting structure (whole-team planning, grooming, and retro + weekly 1x1 with every team member). Making it a 15-person team won't work _at all._

- An hour-long 4-person retro has 10 minutes of speaking time per member — enough to make a point. In a 15-person retro, it's 3 minutes — not practical. You either exclude some people, or extend the meetings — both poor options.
- It's harder to agree on any decision, because you now have 3x the possible objections.
- The 1x1s alone eat up 7 hours (almost a full day!) of your time a week.
- Managing communication of 15 people plus all the external stakeholders is time-consuming.

The team must be split. What does it mean to be a separate team, anyways? Ever heard of "high cohesion and low coupling" principle in software architecture? I think this also applies to teams:

1. Shared information space. Team members know what you're working on, where you're going, who your peers are, the system structure and so on.
2. Own a well-defined part of the product and the codebase. A look at a random feature is enough to guess the responsible team.
3. Control your processes — meeting structure, releases, etc. You can't be responsible for what you can't control.
4. Have all the capabilities needed for your day-to-day work. Begging someone each time you need to deploy, change the API or add a banner is not very effective.

It's best to split by product domain: _customer acquisition team_ owns the landing page and signup, _daily banking team_ owns the main app, and so on. You could split by layer (product + infra) or by function (backend + frontend + mobile) — I feel these compromise points 2 and 4, but let's not die on this hill today. At any rate, a team over 8–10 people must be split into sane-sized chunks to keep going.

### A note on grouping

You can split a team by (A) building the new team out of newbies or (B) mixing newbies and oldies in each new part. Prefer mixing: it distributes the knowledge across the organization, and the social connections from the original team prevent siloing. You could argue that (A) keeps the original high-performing team intact, but it does so by slowing down the new team and undermining your long-term flexibility.

### Where to get new leaders?

Splitting a team into 3 parts creates 2–4 leadership positions, depending on your place in the new structure. Ideally, you have senior members of the original team to lead the new teams, because it's a rare opportunity for career growth on a management track, and they can easily hire and onboard new members of their teams. If you don't have a suitable candidate (everyone is either very junior, or hates management), it's fine to hire externally — following a few hiccups, I recommend hiring people with prior leadership experience, because adjusting to a new product _and_ a new role _at once_ can be too much.

### Split iteratively

You don't have to produce a fully separate team right away. As usual, move step by step — you get faster results, and can adapt to the issues that arise. Here's one possible sequence:

1. Assemble a domain team, appoint one as the _lead_ (you can call it trial-lead, to give them a chance to cop out). 
2. See how they like their new roles, and if the headcount needs tweaking.
3. Run a retro for the new team to catch communication issues or cross-team dependencies early.
4. Separate the domain backlog and kanban boards (or wherever you track the tasks). You'll need it for further process splitting, and to assess the team's load and velocity.
5. Split planning and daily meetings, so that the teams don't waste each other's time on discussing irrelevant tasks.
6. Gradually transfer the remaining processes (1x1s, onboarding, postmortems) to the new lead.
7. Split the codebase, so that the new team can fully own its service.

## Update your processes

Just like your single-team structure, the processes you have will likely fail for a larger team, especially if you have many newbies. Example: we had a liberal release process — if _you_ want some feature in production, _you_ deploy it. As the team grew, the release frequency dropped — the newbies were afraid to touch prod, the oldies were hoping _one_ of the other 14 people would do it. Before I give you my solution to this puzzle, let's look at the general advice for process scaling.

__Localize processes to the new teams.__ Owning processes makes a team more effective. Retros, plannings, kickoffs, demos, daily stand-ups, releases, documenting, on-call duty, whatever you can split, do split. Yes, your overall team loses sight of the stuff going on across the system, causing duplication and poor decisions, but in return we can focus on a specific business area, and maximize productive time instead of drowning in discussions. If you need to offset the downsides, introduce a cross-team sync here and there (still working on this one).

__Let the new teams experiment with processes.__ What worked for your original team doesn't matter, that team is dead and gone. What works for one of your teams won't necessarily work for the other, because they work in different conditions. For example, our CA team has many time-bound tasks from marketing. The core banking team focuses on building _quality_ software, and fixing the bugs as they arise. Very different teams. Start with a copy of your current processes (just to start somewhere!), and introduce team retros as early as possible to tweak the process as needed.

__Stricten the centralized processes.__ Back to our problem with deployment — we couldn't isolate the release process to sub-teams, because splitting a monolithic front-end into independently deployable parts is technically challenging. We introduced a more structured release process:

1. The releases are automatically built and ready to deploy every morning. No more decisions to make.
2. Daily rotation of _release managers_ responsible for getting the release to production. With regular training, you get better at releasing.
3. The release process is clearly documented. The newbies have a clear path to follow, making it less stressful.

This works for other centralized processes — writing documentation, debugging with customer support, maintaining shared libs.

Overall: hand over as much process as you can to the sub-teams, and introduce clear rules for the remaining centralized processes.

## The onboarding valley

Surprisingly, fast hiring can _reduce_ your team's productivity in the short term. The newbies are not yet up to speed, and the oldies now spend time explaining your codebase and reviewing code. This _will_ fix itself over time, but here are a few strategies to get past the bump faster.

__Prefer slower growth.__ Adding one person every few weeks is much better than adding 6 people simultaneously, because:

1. The "onboarding load" stretched over time occupies a smaller share of your team's resource.
2. A few weeks in, new hires can already help onboard someone else. In some cases, they'll do a better job than any oldie, because their memories of one-off tasks like setting up the dev environment are fresh.
3. Every onboarding exposes new roadblocks in your process, helping you smooth the next ones.

On paper, batch onboarding might seem like a time-saver, as you can make a _lecture_ explaining the basics to many people at once. In practice, unless your product is very small, or the tasks are very repetitive, every newbie faces very different challenges, drowning you with a wave of questions.

__Encourage peer-to-peer onboarding.__ As a leader, you might think onboarding is your personal responsibility. I call BS — peer-to-peer onboarding is clearly better:

1. More "onboarding resource" leads to faster, better onboarding.
2. The load on you, personally, decreases, freeing time to do other impactful things and, you know, live.
3. Team members get a safe environment to practice their mentorship skills.
4. People get to know each other, instead of only talking to you.
5. ICs with recent hands-on experience do a better job at explaining the specifics than you.

You can pair a formal "mentor" to every newbie, or direct questions to a team group chat. If you want to control the overall onboarding, at least route specific questions to team members experienced in that area instead of trying to come up with all the answers yourself.

__Write the docs.__ The best way to make onboardings cheaper is writing stuff down instead of explaining it over and over again, with your mouth. Some particular things to focus on:

1. Onboarding checklist — the things _every_ new team member must do: get a VPN certificate from the security dude, join this and that chat, clone a repo here and there, boom you're done. Only include _essential_ steps — adding somewhat useful stuff obscures the actually important things.
2. Document your existing business processes, system architecture, technical conventions, team and communication structure. It's better than explaining in real-time, because you get higher-quality charts, relevant links, and you can collaborate to put the knowledge of multiple team members in one place.
3. Tooling and automation. The more automated a process or convention is, the less onboarding you need. Example: if you build your releases locally and upload somewhere via FTP using the keys you get from Piotr the devops, it's time to set up decent CD instead of documenting the current state of affairs.

Pro tip: encourage newbies to improve and update the docs as they follow along — it's a great first contribution to your team!

## Senior vs junior hires

It seems sensible to focus exclusively on senior hires. Experienced engineers get up to speed quicker, because they're already familiar with the basics, have a lower risk of making catastrophically poor decisions, and can bring good practices and ideas from across the industry to your team.

Not so fast — here are some reasons to hire junior developers. With little exposure to the industry, they can easily adapt to whatever culture and processes you have. _Anyone_ on your team can mentor a junior hire, while getting e.g. a junior engineer with decent knowledge of the product to mentor a newly hired senior engineer might be awkward, not very productive, or even taken as an insult. And of course, you can hire more junior engineers on the same budget.

Overall, aim for a balanced team composition in the mid-term. You don't want your team to be a kindergarten, but a nursing home is no good either. Remember that people tend to gain experience, so the junior engineers you hire will become middle in no time.

--- 

Today, we've discussed the challenges of rapid team growth — and ways to address them:

1. Hiring more engineers won't speed you up unless product, design and QA grow to match.
  - Start by growing product & design.
  - If product lags behind, use the spare time to clean up the tech debt.
  - Expand the area of responsibility of the oversized roles.
2. Teams over 8–10 people are hard to manage.
  - Split into chunks of 3–7 people, preferably by business domain.
  - Mix old and new members in each team.
  - Split step-by-step instead of going all in.
3. The processes of your original team won't accommodate a larger team.
  - Localize the processes to the sub-teams as much as possible.
  - Let the teams tweak their processes to suit their needs.
  - Stricten the remaining centralized processes.
4. Onboarding is time-consuming, and can slow you down.
  - Go slow: onboarding a person every week is easier than 6 people at once.
  - Write the docs instead of explaining stuff over and over.
  - Peer-to-peer knowledge transfer is better than onboarding everyone personally.
5. Hiring only senior engineers is not a silver bullet.
  - Aim for a healthy experience distribution in the mid-term.

Hope these tips help you get past the scaling issues and up to speed in no time.
