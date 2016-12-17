"use strict";

function n1() {
  console.log("a");
}

function n2() {
  n2();
}

async function a2() {
  n1();
  a1();
}

var a1 = async function() {
  n1();
  n2();
}

n2();
