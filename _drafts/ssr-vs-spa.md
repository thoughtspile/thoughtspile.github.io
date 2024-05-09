---
title: 'SSR, SPA, everyting in between, and the virtues of being resourceful'
tags:
  - tech
  - frontend
  - backend
  - javascript
date: 2024-03-10
---

## Robustness

Pure SSR:

- Is stable on faulty clients
- Is unstable on faulty servers
- Scales poorly on user actions

Pure SPA:

- Is _unstable_ on faulty clients
- Is a bit stabler on faulty servers
- Scales better

## Performance

SSR has better TTI, but large

SPA has better TTFB

## Compute location

The basic task of web development is turning data into HTML (then into pixels on the screen), and updating it on user interactions. Creating and updating the HTML requires some computation, which can run either server-, or client-side.

As a business, you want to push as much computation to the client as possible, _until_ it starts getting in the way of users doing what you want them to do. As a user, you want as much computation as possible to happen server-side, _until_ this makes the app sluggish.

Wgile the two parties are at odds, there is a tendency to 

## Storage location

One thing we haven't talked about so far is data location. In web development, we default to storing all data in a database on the server, but it doesn't have to be that way! 

Historically, there wasn't a reliable way to persist data in browser.

## The server-side spectrum

## The client-side spectrum

## Putting it all together

### Pure SSR

### Pure SPA

### Chunked SPA

### Fully universal app

### Fat-client MPA

### SSR with template caching

### SSG

### Partial hyration

### HTMX / Turbo

### Service workers

### Stateful SSR

---


