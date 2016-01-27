---
title: Building a treeless math parser in javascript
date: 2015-10-08
type: post
---

I love developing math apps. It could be sweet if the users could define their own math functions for plotting, filtering, modelling (math is useful). Not quite sure there's anyone but me who needs this, but let me try and see.

## Simple options

The simplicity champ is a "use these functions, they're nice" select:
y&nbsp;=&nbsp;<select>
    <option>x^2+2</option>
    <option>sin(x * cos(x))</option>
</select>
As a developer, I now just have to grab a value from a function list, in this case, [x => x * x + 2, x => Math.sin(x * Math.cos(x))].

Then you could parametrize a predefined input: "I'd rather you used a linear function", y = <input></input> x + <input></input>. Both approaches are somewhat applicable, yet too authoritative for my taste.

But why not teach the poor user some js along the way? "Please use Math.sin for sin, Math.pow(base, exponent) for power (a long manual here), the name of a variable you can play with is x. Have fun!". Now I wouldn't be ashamed to put a plain input:
y = <input value = 'Math.sin(x) + 2 / x'></input>.
Now I grab the value, eval it and am happy with myself. But this is terrorism, isn't it?

## Parsing

So we're left all alone to implement a parser. If you have studied formal grammars, compiler design or something like that, you should recall that a decent parser

- has a tokenizer to never worry about multi-symbol things (as a longIdentifier or a 5678 number or a ++ increment operator);
- turns token sequence into a tree;
- assigns meaning to each node (the value of a '+' node is the sum of its child node values)

Now you kinda drag the tree's root to get the value of the expression.

ASTs are nice: you can run all sorts of compile-time optimizations, check and deduce types and transform expressions as you wish. However, this time just for the hell of it I decided to do *nothing* of the above. Instead I exploit runtime compilation to build a tiny but functional math parser.

Js' Function constructor can turn strings of valid js code into callable functions. With this facility we needn't calculate the expression value step-by-step. The AST can be converted into js code and passed to the interpreter, where it gets the luxury of being treated by world's best compiler engineers instead of some undergraduate computer scientist.

Why in the world would I want to skip the tokenizer and AST parts? Because I've had enough of these during the last 4 years. And, of course, just for the hell of it.

## Implementation

Setting the initial goal pretty low, I start with parsing arithmetics. Js has positional argument passing, so for any expression with two or more variables their order must be specified. Why not make the syntax ES6-y? `'x, y => x + 2 * y'`. No parentheses needed around the argument list, since the expression is already delimeted with the quotes. Anything is possible! Want python? `x, y: x+y`! MATLAB fan? `@(x,y) x+y`! Math purist? `z(x, y) = x + y`. Now split the string on the delimeter, grab the arg-list and the expression, drop the decorations from the arguments and pass these to the Function constructor. Got it working in about 5 decently formatted lines! I celebrate the good job with an `assert(parse('x,y', 'x+y')(1,2) === 3)`.

Next, I wanted to use common math functions without the obligatory Math prefix. So they should be prefixed inside the parser, which can be done with a couple of regexes. Not as easy as it looks: we don't want to prefix `sin` if it's a part of larger identifier, as in `sinful`. No substitutions should occur in quoted strings and regex literals. Since dot notation is sugar for a hash lookup, it should be excluded, too. Finally, according to scoping rules, an argument called `sin` should override the Math property. In the end of the day, we're trying to make believe every property of Math object is a global property without actually polluting the namespace. This can be achieved with some regex  trickery.

By now we have replicated all the default math operations with a clean, short syntax: `parse('x, y', 'sin(PI * x) + cos(PI * y)')(2, 1.5)`. If I wanted some aliasing, maybe allowing for lowercase pi or accepting `tg` instead of tan or making not only Math, but also Math2 function accessible without prefix, this could be done in no time. All I have to do is to make a hash {alias: full_name}, as in {'tg': 'Math.tan'} and grab the relevant substitution when replacing.

## Operator "overloading"

Another thing mathematicians like is operator overloading. Addition and multiplication operators exist for all kinds of obscure mathematical objects: sets, vectors, graphs, imaginary numbers. However, with js we're bound to operating on reals. To "overload" the infix addition operator for js objects we could make a global function, say 'nashAdd', and then convert things that look like 'a + b' to `nashAdd(a, b)`. As a bonus, it allows the `'^'` to finally be exponentiation, not some crazy bit mangling.

Of course, this isn't  true overloading since we don't run any type checks on the parameters. With sufficient patience we could design `nashAdd` to enumerate parameter types and choose an appropriate concrete implementation. Hint: `if (a instanceof Nash and typeof b == 'number') nashAddNashNumber(a, b);`.

Luckily, the power operaator has the highest precedence. We would like to capture the subexpressions to the left and right of it, up to the next operator on the same nesting level. As a special case, any parenthesized subexpression is raised to a parenthesized power. This is the trickiest part, but we can probably get away with a simple parenthesis counter:
```
function capture(str, pos, dir) {
    pos += dir;
    var depth = 0;
    do {
        if (str[pos] == '(')
            depth++;
        else if (str[pos] == ')')
            depth--;
        pos += dir;
    } while (depth != 0);
    while (str[pos] && /[a-z0-9]/i.test(str[pos]))
        pos += dir;
    return pos;
}
```
This also works in cases like `sin(x)^2 -> pow(sin(x), 2)` instead of failing (strictly speaking, this expression is not well defined).

Putting the snippet above to work, we get
```
var pos = -1;
while (true) {
    pos = expr.indexOf('^', pos + 1);
    if (pos < 0)
        break;
    var left = capture(expr, pos, -1);
    var right = capture(expr, pos, 1);
    expr = expr.substring(0, left) +
        'pow(' + expr.substring(left, pos) +
        ',' + expr.substring(pos + 1, right + 1) + ')' +
        expr.substring(right + 1);
}
```
This should run before the prefixing part, because `pow` should be `Math`-prefixed as well.

One thing to note her is that such trick only works because the power operator has the higher precedence. Trying to tackle addition in this manner would not work. More on working around this in the next part of the series!

That's it, we have a functional math parser of 1KB! It can handle all the basic arithmetics, standard math functions, exponentiation, constants like `E` or `PI`. Hoverver, the design is somewhat nasty since it relies on the global Math object. Don't worry, I have a neat metaprogramming trick up my sleeve to handle this! Stay tuned for the next post in the series.
