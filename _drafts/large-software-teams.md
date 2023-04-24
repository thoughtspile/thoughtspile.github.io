---
title: How large software teams work
date: 2023-04-02
tags:
  - javascript
  - interview
---

The starting point is very simple: you have a business, and the business wants to make money because that's what a business does. There are many ways to make money. You could clean cars, sell tomatoes, build homes. Just for the sake of it, let's suppose the business chooses to build a digital product.

From here, we start building the team to build this software. And for that we need... "Programmers!", i hear you say. No, not programmers. I

Now, once we start getting an idea of what we're building, come the programmers. In fact, it's better to call this team _engineering,_ because not everyone on it writes actual programs. For now, let's picture it as a box that receives feature descriptions as the input and outputs working software to the users, we'll get into more detail later.

We're still missing a crucial step in turning a rough "idea" into working software — design. 

## Backtracking and communication

Our roughh team struture suggests the happy path for product development:

1. Product comes up with features that make up a product.
2. Designer further breaks down the tasks.
3. Engineering builds the producs.
4. The users are happy and give us money.
5. Everybody drinks lemonade on the beach.

However, that's not how this works, because we have technical limitations. Imagine that the product decides to add realtime collaboration. Design creates a beautiful UI for t

This backtracking is better than 

## Feedback

A team with decent hard skills and communication can build a reasonable product that lookks good — to the team. Hard thuth is, the result that everyone on the team is pleased with is not guaranteed to hit the initial goals, when faced with real users. In order to actually make progress towards your goals, you need to see how the change performs with users.

The obvious way of seeing if a change performs well with the users is looking at the data. 

Another important feedback channel is customer support. Users inevitably fail to do some things they want .

## Engineering team

## Product team

Product manager. 

For more complex domains, it's not realistic for a PM / PO to be good at building digital products, while _also_ being an expert in the domain. For one, think of banking — 

Finally, analyzing user data can also get quite complex once you account for statistical significance margins, data volume, and so on — this is a __Product Analyst.__

It's very common for the whole area to be handled by a single product manager, or by several people with a PM title who have some combination of the capabilities described above.

## Design team

While the _designers_ are commonly perceived as . Design is the crucial briodge between product and engineering, to the point that I'd say . Designers ususally iterate on a feature with the product team, helping 

Of course, design itself is a diverse field with many sub-roles. To name a few, you can be a product designer, UX researcher / designer, interaction designer, illustrator. Text-related roles like copywriting, UX writing, translation also opertate on roughly the same level as design

## Fast route

This might sound weird coming from an engineer, but engineering team is a nightmare. Developers are expensive, they make errors, they go on holidays, they get bored and depressed. Overall, the engineering team is the bottleneck that you want to avoid.

Content management.

Operations.

In both cases, you're doing _more_ engineering up-front to save engineering time in the long term, which makes sense for a long-running product.

In fact, you can have a software team without engieering.

## A few extra touches

Now we have many arrows, and the task takes a convoluted route. Making sure people talk to each other, even when they're not . Here comes the __project manager!__

The business always wants to get more done, faster. The product team, therefore, tends to put pressure on the engineering team, eventually leading to lower quality and burnout. Offsetting this pressure is the primare function of a __team lead.__ The lower-level details of a team lead's job vary a lot — some are more focused on the technical side of things, some provide lower-level project management, with some HR functions on top, but the ultimate goal is to make the engineering sustainable in the long term. In larger engineering teams that are split into sub-teams, you'll often encounter an __engineering manager__ who essentially leads team leads. While the team lead looks like the boss of the engineering team, it's uncommon for designers to report to the TL.

Legal.

Marketing.

## Variations

We've briefly touched on _infrastructure teams,_ so 

Outsource / consulting teams are peculiar, because 

Finally, the overall function structure translates to small teams surprisingly well — it's quite common to have a single product-focused person, and a single engineer.

## Scaling up

What we've discussed so far is a single product team. A team grows beyond a certain size (let's say 50 people, and that's an upper-end estimate). There are many, many ways in which an organization can be made up of multiple teams, and we're not going to discuss them here, but as a rule of thumb, the organization consists of

- Multiple product teams, largely independent.
- A bunch of infrastructure teams that don't directly ship anything to the users, but provide _services_ or deliver _products_ to the product teams. Some exmaples will be: security team, DevOps team, design system team.
- A management structure on top of that. 
- If the business has any connection to the real world, . To the best of my knowledge, it's called _operations._
- The usual generic departments — HR, finance, accounting, cleaning, and so on.

---
