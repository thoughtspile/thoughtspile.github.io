---
title: Simpifying AngularJS controllers with ES5 get / set
permalink: "/{{ page.date | date: '%Y/%m/%d' }}/{{ slug }}/index.html"
tags:
  - angularjs
  - javascript
  - programming
  - frontend
date: 2018-09-20 17:04:06
---


I've been developing an AngularJS application for the past year — and _voila!_ here I am, alive and well. I'm not some crazy old fuck who thinks AngularJS is a promising new technology. Nor have I been waiting to publish this post for 3 years. It's just how things turned up for me. Since there's no shortage of AngularJS apps in the wild, I've decided to share some tips for taming Angular (the Terrible one) and staying sane (yes you can).

## The context — where am I? (Help)

Some context first. I spent two years developing React front-ends. When offered a job on an AngularJS app, I was scared at first — we've all spent years making fun of it. The team lead was shaking a full Vue rewrite around not to scare the candidates off. The idea of playing around with Vue felt good (I'm a playful coder, don't judge me), but Joel Spolsky's [spooky story](https://www.joelonsoftware.com/2000/04/06/things-you-should-never-do-part-i/) of Netscape's full rewrite had been growing on me for years. And well, there were _features_ to be made, no time for the geek fun.

Now I'm gone from the project (no relation to the tech stack whatsoever), and the app is still moslty AngularJS. It's in a good shape, and has all the modern things: webpack, babel, a sprinkle of React here and there. I feel I've made a good job by focusing on the business stuff.

## The Problem — what's wrong?

So, what was it I was gonna tell you kids about? We have a service that holds the list of users. Here it is, with all the ES6 exquisiteness:

```js
class UserService {
  load() {
    return get('/users');
  }
}
```

Now, the component. All basic, too, just shows a list of users:

```js
class UserListController {
  constructor(userService) {
    this.userService = userService;
    this.userService.load().then(users => {
      this.users = users;
    });
  }
}

angular.component('userList', {
  template: `<user-card ng-repeat="user in $ctrl.users" user="user"></user-card>`,
  controller: UserListController
});
```

But we can also add a user. Once the thing is done, we should update the list — it's surely changed. But — oh no! — we have no way of doing it, because the data is stuck in `UserListController`.

```js
class UserService {
  load() {
    return get('/users');
  }

  addUser(user) {
    return post('./users', user).then(/* oops */);
  }
}
```

## The classic solution

The classic, ES3-level [solution put forward by Justin Obney](https://www.justinobney.com/keeping-angular-service-list-data-in-sync-among-multiple-controllers/) is to make `users` the property of `UserService` and never reassign it, only mutate (mute? mutilate?). The controller references the service property, and the angular view watch works, since `users` are shared by reference. Here's the code:

```js
class UserService {
  constructor() {
    this.users = [];
  }

  load() {
    return get('/users').then(users => {
      angular.copy(users, this.users);
    });
  }

  addUser(user) {
    return post('./users', user).then(() => this.load());
  }
}

class UserListController {
  constructor(userService) {
    this.userService = userService;
    this.users = this.userService.users;
    userService.load();
  }
}
```

There are three problems with this solution:

1. It's fragile: if we accidentally reassign `users` either in the controller or the service, the whole scheme breaks down.
2. Instead of using normal javascript, you dance around the reference. The result of a well-behaved library function that does not mutate the data must be merged back into the original object.
3. The suggested way of caring for the reference, `angular.copy`, is angular-specific and makes a deep copy.

We can work around the first issue using TypeScript's `readonly` properties, but the reference dance persists. Using TS2+ over AngularJS is a bit bipolar, too (exacly what I used on the project, but that's beside the point).

Luckily, we can do much better — let me show you how.

## The get / set solution

My solution relies on ES5 getters. Compatibility analysis, if I please? ES5 is nothing hot, it's been around long enough to be considered the web standard. People who use IE9 are probably used to the web looking and working strange. Considering a modern framework — Vue or React? They require IE9+ anyways. So yes, we can use ES5 safely.

We do whatever we want to the service property, and declare a getter for it on the controller:

```js
class UserService {
  constructor() {
    this.users = [];
  }

  load() {
    return get('/users').then(users => {
      this.users = users;
    });
  }

  addUser(user) {
    return post('./users', user).then(() => this.load());
  }
}

class UserListController {
  constructor(userService) {
    this.userService = userService;
    userService.load();
  }

  get users() {
    return this.userService.users;
  }
}
```

Digest works normally. Mutate the `users` array in the service and the views update. Reassign in the service — the views still update. Mutate the array in a controller — the views update (a bug, not a feature? Maybe, but that's how it goes). We can't accidentally reassign the controller property because it only has a getter. And we have zero angular-specific code. The trick is backwards-compatible with the old one, so we needn't rewrite the service all at once. Nice!

## What good have we done?

Is this the holy grail? Certainly not. It requires some boilerplate, a 4-line getter per controller. We're still stuck with the shaky shared ownersip: every controller can change the object. But this is an improvement over the old way.

For completeness, here are three other solutions off the top of my head:

1. Bind to service from the template: `<user-card ng-repeat="user in $ctrl.userService.users"></user-card>`. Bad, because it breaks abstraction layering — the view should not touch the service.
3. Make the service an event bus, do `this.trigger('users.update', users);` on every users change. Vanilla implementation is fragile (never forget to call `trigger` on update), but this might work with some structure around (though at this point we might as well stick mobx into the service).
2. `$scope.$watch(() => this.userService.users, users => this.users = users)`. The effect is the same as in my solution, but at the cost of an extra digest iteration. Fall back to this one for ES3 complicance.

 Never say never to AngularJS — who knows how it's gonna turn out. Drop a comment if the topic interests you! I still have a couple of AngularJS tricks down my sleeve to keep you safe. ES6 modules? String templates? CSS modules? Yes you can.
