"use strict";

const rule = require("../rules/no-await-async-call");
const RuleTester = require("eslint").RuleTester;

// eslint understands async/await using babel-eslint
const ruleTester = new RuleTester({ parser: "babel-eslint" });

const MESSAGE = "Call to async function without await";
const errors = [{type: "CallExpression", message: MESSAGE}];

ruleTester.run("no-await-async-call", rule, {
  valid: [
    "function f() {g()}",
    "async function g() {}; async function f() {await g()}",
  ],

  invalid: [
    // async func f calls async func g without await (g declared before f)
    { code: "async function g() {}; async function f() {g()}", errors },
    // same, but g declared after f
    { code: "async function f() {g()}; async function g() {}", errors },
    // async func f calls anonymous async func g without await (g declared before f)
    { code: "let g; g = async function() {}; async function f() {g()}", errors },
    { code: "let g = async function() {}; async function f() {g()}", errors },
    // Same with arrow functions...
    { code: "let g; g = async () => {}; async function f() {g()}", errors },
    { code: "let g = async () => {}; async function f() {g()}", errors },
    { code: "let g; g = async function() {}; async () => {g()}", errors },
    { code: "let g = async function() {}; async () => {g()}", errors },
    { code: "let g; g = async () => {}; async () => {g()}", errors },
    { code: "let g = async () => {}; async () => {g()}", errors },
    // Nested functions...
    { code: "function parent() { let g = async () => {}; async () => {g()} }", errors },
    { code: "let g = async () => {}; function p() { async () => {g()} }", errors },
    { code: "let g = async () => {}; function p1() { function p2() {async () => {g()} } }", errors },
    { code: `let g;
      function p() {
        async () => {
          g();
        }
      };
      g = async () => {await x}`,
      errors
    },
    { code: `let g1; let g2;
      function p1() {
        async function p2() {
          async () => {
            g2();
            g1();
          }
        }
      };
      g1 = async () => {};
      g2 = async () => {}`,
      errors: [{type: "CallExpression", message: MESSAGE}, {type: "CallExpression", message: MESSAGE}]
    },
  ]
});
