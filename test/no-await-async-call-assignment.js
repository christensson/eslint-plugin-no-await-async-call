"use strict";

const rule = require("../rules/no-await-async-call-assignment");
const RuleTester = require("eslint").RuleTester;

// eslint understands async/await using babel-eslint
const ruleTester = new RuleTester({ parser: "babel-eslint" });

const MESSAGE = "Call to async function without await on assignment";
const errors = [{type: "CallExpression", message: MESSAGE}];

ruleTester.run("no-await-async-call-assignment", rule, {
  valid: [
    "function f() {g()}",
    "async function g() {}; async function f() {let x = await g()}",
    "let g = async function () {}; async function f() {let x = await g()}",
    "let g = function () {}; g = async function() {}; async function f() {let x = await g()}",
  ],

  invalid: [
    // async func f calls async func g without await (g declared before f)
    { code: "async function g() {}; async function f() {let x = g()}", errors },
    // same, but g declared after f
    { code: "async function f() {let x = g()}; async function g() {}", errors },
    // async func f calls anonymous async func g without await (g declared before f)
    { code: "let g; g = async function() {}; async function f() {let x = g()}", errors },
    { code: "let g = async function() {}; async function f() {let x = g()}", errors },
    // Same with arrow functions...
    { code: "let g; g = async () => {}; async function f() {let x = g()}", errors },
    { code: "let g = async () => {}; async function f() {let x = g()}", errors },
    { code: "let g; g = async function() {}; async () => {let x = g()}", errors },
    { code: "let g = async function() {}; async () => {let x = g()}", errors },
    { code: "let g; g = async () => {}; async () => {let x = g()}", errors },
    { code: "let g = async () => {}; async () => {let x = g()}", errors },
    // Function redfinition...
    { code: "let g = () => {}; g = async () => {}; async () => {let x = g()}", errors },
    // Nested functions...
    { code: "function parent() { let g = async () => {}; async () => {let x = g()} }", errors },
    { code: "let g = async () => {}; function p() { async () => {let x = g()} }", errors },
    { code: "let g = async () => {}; function p1() { function p2() {async () => {let x = g()} } }", errors },
    { code: `let g;
      function p() {
        async () => {
          let x = g();
        }
      };
      g = async () => {await x}`,
      errors
    },
    { code: `let g1; let g2;
      function p1() {
        async function p2() {
          async () => {
            let x = g2();
            let y = g1();
          }
        }
      };
      g1 = async () => {};
      g2 = async () => {}`,
      errors: [{type: "CallExpression", message: MESSAGE}, {type: "CallExpression", message: MESSAGE}]
    },
  ]
});
