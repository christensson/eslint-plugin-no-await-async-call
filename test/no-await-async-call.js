"use strict";

const rule = require("../rules/no-await-async-call");
const RuleTester = require("eslint").RuleTester;

// eslint understands async/await using babel-eslint
const ruleTester = new RuleTester({ parser: "babel-eslint" });

const MESSAGE = "Call to async function without await";
const MESSAGE_ASSIGNMENT_REQUIRED = "Call to async function without await on assignment";
const errors = [{type: "CallExpression", message: MESSAGE}];
const errorsAssignmentRequired = [{type: "CallExpression", message: MESSAGE_ASSIGNMENT_REQUIRED}];

ruleTester.run("no-await-async-call", rule, {
  valid: [
    { code: "function f() {g()}", options: [] },
    { code: "async function g() {}; async function f() {await g()}", options: [] },
    { code: "let g = async function () {}; async function f() {await g()}", options: [] },
    { code: "let g = function () {}; g = async function() {}; async function f() {await g()}", options: [] },
    { code: "class A { async g() {} async f() {await this.g()} }", options: [] },
    { code: "function f() {g()}", options: ["assignment-required"] },
    { code: "async function g() {}; async function f() {let x = await g()}", options: ["assignment-required"] },
    { code: "let g = async function () {}; async function f() {let x = await g()}", options: ["assignment-required"] },
    { code: "let g = function () {}; g = async function() {}; async function f() {let x = await g()}", options: ["assignment-required"] },
  ],

  invalid: [
    // async func f calls async func g without await (g declared before f)
    { code: "async function g() {}; async function f() {g()}", options: [], errors },
    // same, but g declared after f
    { code: "async function f() {g()}; async function g() {}", options: [], errors },
    // async func f calls anonymous async func g without await (g declared before f)
    { code: "let g; g = async function() {}; async function f() {g()}", options: [], errors },
    { code: "let g = async function() {}; async function f() {g()}", options: [], errors },
    // Same with arrow functions...
    { code: "let g; g = async () => {}; async function f() {g()}", options: [], errors },
    { code: "let g = async () => {}; async function f() {g()}", options: [], errors },
    { code: "let g; g = async function() {}; async () => {g()}", options: [], errors },
    { code: "let g = async function() {}; async () => {g()}", options: [], errors },
    { code: "let g; g = async () => {}; async () => {g()}", options: [], errors },
    { code: "let g = async () => {}; async () => {g()}", options: [], errors },
    // Function redfinition...
    { code: "let g = () => {}; g = async () => {}; async () => {g()}", options: [], errors },
    // Nested functions...
    { code: "function parent() { let g = async () => {}; async () => {g()} }", options: [], errors },
    { code: "let g = async () => {}; function p() { async () => {g()} }", options: [], errors },
    { code: "let g = async () => {}; function p1() { function p2() {async () => {g()} } }", options: [], errors },
    { code: `let g;
      function p() {
        async () => {
          g();
        }
      };
      g = async () => {await x}`,
      options: [],
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
      options: [],
      errors: [{type: "CallExpression", message: MESSAGE}, {type: "CallExpression", message: MESSAGE}]
    },
    // ES6 classes
    { code: `class A {
        async f() {}
        async g() {
            this.f();
        }
      }`,
      options: [],
      errors
    },
    { code: `class A {
        static async f() {}
        async g() {
            A.f();
        }
      }`,
      options: [],
      errors
    },

    // async func f calls async func g without await (g declared before f)
    { code: "async function g() {}; async function f() {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    // same, but g declared after f
    { code: "async function f() {let x = g()}; async function g() {}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    // async func f calls anonymous async func g without await (g declared before f)
    { code: "let g; g = async function() {}; async function f() {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    { code: "let g = async function() {}; async function f() {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    // Same with arrow functions...
    { code: "let g; g = async () => {}; async function f() {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    { code: "let g = async () => {}; async function f() {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    { code: "let g; g = async function() {}; async () => {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    { code: "let g = async function() {}; async () => {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    { code: "let g; g = async () => {}; async () => {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    { code: "let g = async () => {}; async () => {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    // Function redfinition...
    { code: "let g = () => {}; g = async () => {}; async () => {let x = g()}", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    // Nested functions...
    { code: "function parent() { let g = async () => {}; async () => {let x = g()} }", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    { code: "let g = async () => {}; function p() { async () => {let x = g()} }", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    { code: "let g = async () => {}; function p1() { function p2() {async () => {let x = g()} } }", options: ["assignment-required"] , errors: errorsAssignmentRequired },
    { code: `let g;
      function p() {
        async () => {
          let x = g();
        }
      };
      g = async () => {await x}`,
      options: ["assignment-required"],
      errors: errorsAssignmentRequired
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
      options: ["assignment-required"],
      errors: [{type: "CallExpression", message: MESSAGE_ASSIGNMENT_REQUIRED}, {type: "CallExpression", message: MESSAGE_ASSIGNMENT_REQUIRED}]
    },
  ]
});
