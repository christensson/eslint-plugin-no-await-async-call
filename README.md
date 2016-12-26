# eslint-plugin-no-await-async-call
Enforces that all calls to async functions within an async function is awaited.

## Installation
npm install eslint-plugin-no-await-async-call --save

## Usage
Via .eslintrc (Recommended)
### .eslintrc
```
{
  "plugins": ["no-await-async-call"],
  "rules": {
    "no-await-async-call/no-await-async-call": 2,
  }
}
```

Or if required that the async function return value is stored in a variable
### .eslintrc
```
{
  "plugins": ["no-await-async-call"],
  "rules": {
    "no-await-async-call/no-await-async-call": [ 2, "assignment-required" ]
  }
}
```

## Rules
### no-await-async-call/no-await-async-call (no configuration options)
Invalid code: (since f is called without await)
```
async function f() {};
async function g() {
  f();
}
```
Valid code:
```
async function f() {};
async function g() {
  await f();
}
```

### no-await-async-call/no-await-async-call (configuration option "assignment-required")
Invalid code: (since f is called without await)
```
async function f() {};
async function g() {
  let x = f();
}
```
Valid code:
```
async function f() {};
async function g() {
  let x = await f();
}
```
