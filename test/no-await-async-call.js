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
      code: "async function f2() {await x}; async function f() {f2();}",
      code: "async function f2() {await x}; async function f() {f2();}",
      errors: [{type: "CallExpression", message: MESSAGE}],
    },
    /*{
      code: "var invalidVariable = true",
      errors: [ { message: "Unexpected invalid variable." } ]
    }*/
  ]
});
