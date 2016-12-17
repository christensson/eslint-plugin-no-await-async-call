"use strict";

const PROP = {
  ASYNC: "async",
  REPORT_IF_ASYNC: "report_if_async"
};

module.exports = function(context) {
  const allowThrow = context.options[0] === "allow-throw";
  const stack = [];
  // Map to store if:
  // - PROP.ASYNC - Visited function declarations represent async functions
  // - PROP.REPORT_IF_ASYNC - Visited function calls within an async function
  // aren't awaited and thus shall report errors if later found out to be async.
  const funcPropMap = {};

  function setFuncProp(funcId, propName, value) {
    if (!(funcId in funcPropMap)) {
      funcPropMap[funcId] = {};
    }
    funcPropMap[funcId][propName] = value;
  }

  function getFuncProp(funcId, propName) {
    if (funcId in funcPropMap) {
      return funcPropMap[funcId][propName];
    }
    return undefined;
  }

  function onFunctionEnter(node) {
      const frame = {
        isAsync: node.async
      };
      stack.push(frame);
      if (node.type === "FunctionDeclaration") {
        const functionName = node.id.name;
        setFuncProp(functionName, PROP.ASYNC, node.async || false);
        const reportNodeIfAsync = getFuncProp(functionName, PROP.REPORT_IF_ASYNC)
        if (node.async && reportNodeIfAsync) {
          context.report({
            node: reportNodeIfAsync,
            message: "Call to async function without await",
          });
        }
      } else if (node.type === "ArrowFunctionExpression") {
        // TODO
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
        // We have a function call within an async function...
        const calledWithAwait = node.parent && node.parent.type === "AwaitExpression";
        const calledFunctionName = node.callee.name;
        if (!calledWithAwait) {
          // That is called without await...
          const calledFuncIsAsync = getFuncProp(calledFunctionName, PROP.ASYNC);
          if (calledFuncIsAsync === undefined) {
            // We don't know yet if called function is async...
            setFuncProp(calledFunctionName, PROP.REPORT_IF_ASYNC, node);
          } else if (calledFuncIsAsync) {
            context.report({
              node: node,
              message: "Call to async function without await",
            });
          }
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