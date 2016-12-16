"use strict";

module.exports = function(context) {
  const allowThrow = context.options[0] === "allow-throw";
  const stack = [];
  const funcPropMap = {};

  function onFunctionEnter(node) {
      const frame = {
        isAsync: node.async
      };
      stack.push(frame);
      if (node.type === "FunctionDeclaration") {
        const functionName = node.id.name;
        funcPropMap[functionName] = node.async || false;
      }
    }

    function onFunctionExit(node) {
      const frame = stack.pop();
    }

  return {
    Program: onFunctionEnter,
    "Program:exit": onFunctionExit,

    FunctionExpression: onFunctionEnter,
    "FunctionExpression:exit": onFunctionExit,

    FunctionDeclaration: onFunctionEnter,
    "FunctionDeclaration:exit": onFunctionExit,

    ArrowFunctionExpression: onFunctionEnter,
    "ArrowFunctionExpression:exit": onFunctionExit,

    ThrowStatement(node) {
      const frame = stack[stack.length - 1];
      frame.foundThrow = true;
    },

    YieldExpression(node) {
      // await nodes are YieldExpression"s with babel-eslint < 7.0.0
      const frame = stack[stack.length - 1];
      frame.foundYield = true;
    },

    CallExpression(node) {
      const frame = stack[stack.length - 1];
      if (frame.isAsync) {
        // We have a function call within an async function
        const calledWithAwait = node.parent && node.parent.type !== "AwaitExpression";
        const calledFunctionName = node.callee.name;
        let calledFuncIsAsync = false;
        if (calledFunctionName in funcPropMap) {
          calledFuncIsAsync = funcPropMap[calledFunctionName];
        } else {
          console.log("WARNING: Function not traversed yet", calledFunctionName);
        }
        if (calledWithAwait && calledFuncIsAsync) {
          context.report({
            node,
            message: "Call to async function without await",
          });
        }
      }
    }
  };
};

module.exports.schema = [
  {
    enum: ["allow-throw"],
  },
];
