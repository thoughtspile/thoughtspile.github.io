---
title: 'Angular Tip: Derived Interfaces in TypeScript'
tags:
  - typescript
  - javascript
  - angular
  - programming
  - frontend
  - tips
date: 2018-10-22
---

If you use Angular DI, you probably declare your service classes twice, like this:

```ts
export interface IUserService {
  getUsers(): IUser[];
}

export class UserService implements IUserService {
  getUsers() {
    return fetch<IUser[]>('/users');
  }
}
```

Declaring classes like this is horrible. You describe your logic twice for no good reason. You get no extra error protection, no better code completion, no benefits whatsoever. You just edit twice on every change.

You don't normally share an interface between classes. The language, unlike C++, does not require you to declare the signature before the implementation for technical reasons. You write twice as much code because the framework wants you to. Why chose to live like that?

Luckily, in TS you can just write:

```ts
export class UserService {
  getUsers() {
    return fetch<IUser[]>('/users');
  }
}

export type IUserService = UserService;
```

You get proper type inference in methods, and the interface is then itself inferred from the implementation. You're welcome!
