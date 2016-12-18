"use strict";
const noAwaitAsyncCall = require("./no-await-async-call");

module.exports = function(context) {
  return noAwaitAsyncCall(context, true);
};
