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
    "async function g() {await x}; async function f() {await g();}",
  ],

  invalid: [
    // async func f calls async func g without await (g declared before f)
    { code: "async function g() {await x}; async function f() {g();}", errors },
    // same, but g declared after f
    { code: "async function f() {g();}; async function g() {await x}", errors },
    // async func f calls anonymous async func g without await (g declared before f)
    { code: "let g; g = async function() {await x}; async function f() {g();}", errors },
    { code: "let g = async function() {await x}; async function f() {g();}", errors },
    // Same with arrow functions...
    { code: "let g; g = async () => {await x}; async function f() {g();}", errors },
    { code: "let g = async () => {await x}; async function f() {g();}", errors },
    { code: "let g; g = async function() {await x}; async () => {g();}", errors },
    { code: "let g = async function() {await x}; async () => {g();}", errors },
    { code: "let g; g = async () => {await x}; async () => {g();}", errors },
    { code: "let g = async () => {await x}; async () => {g();}", errors },
    // Nested functions...
    { code: "function parent() { let g = async () => {await x}; async () => {g();} }", errors },
    { code: "let g = async () => {await x}; function parent() { async () => {g();} }", errors },
    { code: "let g = async () => {await x}; function parent1() { function parent2() {async () => {g();} } }", errors },
    //{ code: "let g; function parent() { async () => {g();} }; g = async () => {await x}", errors },
  ]
});
