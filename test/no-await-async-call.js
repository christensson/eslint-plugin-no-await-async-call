"use strict";

const rule = require("../rules/no-await-async-call");
const RuleTester = require("eslint").RuleTester;

// eslint understands async/await using babel-eslint
const ruleTester = new RuleTester({ parser: "babel-eslint" });

const MESSAGE = "Call to async function without await";

ruleTester.run("no-await-async-call", rule, {
  valid: [
    "function f() {g()}",
    "async function f2() {await x}; async function f() {await f2();}",
  ],

  invalid: [
    {
      // async func f calls async func g without await (g declared before f)
      code: "async function g() {await x}; async function f() {g();}",
      // same, but g declared after f
      code: "async function f() {g();}; async function g() {await x}",
      // async func f calls anonymous async func g without await (g declared before f)
      code: "let g = async function() {await x}; async function f() {f2();}",
      //code: "let f2 = async () => { await x }; let f = async () => { await f2()}",
      errors: [{type: "CallExpression", message: MESSAGE}],
    },
  ]
});
