---
title: Why you Might Want to Extend React Components
date: 2018-11-05
tags:
  - react
  - frontend
  - javascript
  - programming
---


Do not `extend` components. If there is anything React community agrees upon, this is it. [Use HOCs](https://reactjs.org/docs/composition-vs-inheritance.html). Use state managers (and their connector HOCs). Use render props. [Do not inherit](https://stackoverflow.com/a/47032288/2699012). Remember, [composition over inheritance](https://en.wikipedia.org/wiki/Composition_over_inheritance)! Obey your guru. Once upon a time, a developer extended his component, and a lightning stroke him.

This is a mantra. I like mantras just as much as [Steven here](https://www.thoughtworks.com/insights/blog/composition-vs-inheritance-how-choose) (I don't). Things other people say should not discourage you from thinking for yourself, doing your research and analyzing design choices pragmatically, not superstitiously.

For a motivational example: when the docs say `At Facebook, we use React in thousands of components, and we haven't found any use cases where we would recommend creating component inheritance hierarchies`, that's a bit tongue-in-cheek. They have indeed found at least one such case — sitting right in React core, there is `PureComponent`. With this in mind, let us embark on journey to stop being afraid and extend our components joyfully.

## Introducing Component Inheritance

A bit of history for those who haven't been around in the wild days of React (circa 2014). We had no redux, no HOCs, and no idea how to write React apps that do not fall apart. We came up with all sorts of wild patterns. Coding was adventurous and imaginative, just probably not in a good way.

Our working example starts with an idea of making a reusable piece of logic that would give our components `toggle` functionality — provide a boolean state flag and a way to switch it. The guys with OOP background see an immediately apparent way to do it. We make a semi-component:

```js
class Togglable extends React.Component {
  // Basic React state stuff
  constructor() {
    super();
    this.state = { open: false };
    this.toggle = this.toggle.bind(this);
  }
  toggle() {
    this.setState({ open: !this.state.open });
  }
  // Why semi-? No render, won't work by itself.
}
```

And now we extend it with `render` definition of our choice:

```js
class TogglerExt extends Togglable {
  render() {
    return (<div onClick={this.toggle}>
      {this.state.open ? 'open' : 'closed'}
    </div>);
  }
}
```

For completeness, here's a canonical way to do this in 2018 using a HOC:

```js
const withToggle = Cmp => {
  return class WithToggle extends React.Component {
    constructor() {
      super();
      this.state = { open: false };
      this.toggle = this.toggle.bind(this);
    }
    toggle() {
      this.setState({ open: !this.state.open });
    }
    render() {
      return <Cmp open={this.state.open} toggle={this.toggle} />;
    }
  };
}

const TogglerHoc = withToggle(p => (
  <div onClick={ p.toggle }>
    {this.state.open ? 'open' : 'closed'}
  </div>
));
```

We could also write this in three lines of [recompose](https://github.com/acdlite/recompose) (`withState` + `withHandlers`), but that's beside the point. Also note how the code for both options is almost identical — we'll use this later to do something cool.

## The Business: Reuse Legacy Components

You know these — components that are 300+ lines long and have a fair share of business  logic in them. For some reason, they usually have JSX-returning methods, something like `renderAvatar`. The most infuriating thing about these? They may be old, obese and gross, but they've been around this project longer than you have, and are mostly working the way they're supposed to. Something like this:

```js
class UserCard extends Component {
  renderMenu() {
    // some JSX here
  }
  isOnline() {
    // and a lot of logic there
  }
  render() {
    return (<Card>
      <Avatar url={this.props.avatar} isOnline={this.isOnline()} />
      { this.renderMenu() }
    </Card>);
  }
}
```

So, how would you approach making a similar component with the same business logic and similar layout parts? To be concrete, let's say we want to put our users into a table instead of a card list. Would you run and start decomposing, making `render*` methods proper components, extracting the business logic into a state manager? Do you have all the time in the world to do this task? Let's hack around and do some real work.

`extend` to the rescue!

```js
class UserRow extends UserCard {
  render() {
    return (<tr>
      <td>
        <Avatar url={this.props.avatar} isOnline={this.isOnline()} />
      </td>
      <td>{ this.renderMenu() }</td>
    </tr>);
  }
}
```

Do not judge me! We've reused the old component without disrupting its function and with little to no duplication (just some in the `render` method). Let's try once again, with method overrides and super calls:

```js
class SellerCard extends UserCard {
  renderMenu() {
    return this.props.isBlocked
      ? <Menu warn="Blocked seller" />
      : super.renderMenu();
  }
}
```

There's a hundred reasons not to write components like this, and I wouldn't call it a clean solution I am proud of, but this is very effective in getting out of the _so worried about the state of your codebase you can't eat_ block.


## The Technical: Performance Considerations

Never mind the design, let's move into the land of extreme performance hacks. Common sense tells that with HOCs React has twice as much bookkeeping to do: set up both the parent and the child components, call their lifecycle hooks in the proper order, and so on. So, subclass components should be faster than HOCs.

Since common sense is not worth much when it comes to performance testing, I made an actual benchmark using the toggler example introduced earlier. It is a realistic use case, not some synthetic benchmark. Still, it shows updating the HOC to be slightly (3–10%) slower in webkits (Chrome and Safari), and 50% slower in Firefox. If you don't trust me, head over to a [special repo](https://github.com/thoughtspile/hoc-vs-extend) and see for yourself.

This is probably not a deal-breaker for most real apps, but, again, something to keep in mind — layering HOCs has a real performance cost. This is also the reason why `PureComponent` works best as-is — having performance helpers be performant makes sense.

## Best of Both Worlds (and Generality)

An especially powerful thing about the extend pattern is its generality. The parent component exposes all its methods and internal state for you to play with, so you can do whatever you please, even make a HOC out of it! This openness is not always good — with great power comes great responsibility, _etcetera, etcetera._ For what it's worth, here is the extend-toggler, wrapped in a HOC:

```js
const withToggleExt = Cmp => {
  return class WithToggle extends Togglable {
    render() {
      return <Cmp open={this.state.open} toggle={this.toggle} />;
    }
  };
};
```

With a bit of trickery you could even make a generic _hocifier_ that takes two components and plugs one into the other's render method.

## The Downsides

Frankly, I do not extend components all the time either, and here is why:

- No clear-cut interface boundary. Well-written HOCs have decorator options and the props they inject into the decorated component. With extend, all the component code is the public interface. You can somewhat cover it with TypeScript, but it's duct tape over duct tape.
- There is no way to inherit from several components. Using extend, you can't make your component both Pure and Togglable. HOCs, on the other hand, are easily composable, albeit with a runtime performance cost. Granted, JS is so dynamic you could write your own multiple inheritance / mixin engine, but this is also beyond the scope of this article.
- You can't use functional components any more. Not for the base components, not for the derived ones. It's a pity, I love the brevity and ease of creation.
- Lifecycle hooks in child components are verbose. If you define `componentDidMount` in the child component, it's now your responsibility to call the parent hook. Even worse, the parent hook may or may not exist, so you have to check before you call.

Dual extend / HOC pattern works around these issues nicely, but nullifies the performance benefits.

---

So, should switch to extending your components exclusively? As you might have guessed by the downside list, absolutely not! Just do not rule out this option, especially if you're developing a library. Since you can expose both options to the library users, there's no reason to reject. To repeat, the two cases where I find `extend` viable are:

- Making a slightly changed version of a legacy component without rewriting it completely.
- Squeezing the last bit of performance out of your helper components, at the expense of convenience.

If you like what you just read, encourage me in the comments and subscribe to my blog — I have a more exhaustive overview of React composition patterns in writing, with HOCs, render props, and maybe even `useState`. If you hate what you just read (interesting! why are you still reading it then?) — discourage me in the comments or write an angry email. Anyways, you're a bit smarter now. Have a nice week and enjoy yourself.
