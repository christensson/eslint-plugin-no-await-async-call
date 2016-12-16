"use strict";

function n1() {
  console.log("a");
}

function n2() {
  n2();
}

async function a2() {
  n1();
  await a1();
}

async function a1() {
  n1();
  n2();
}

n2();
