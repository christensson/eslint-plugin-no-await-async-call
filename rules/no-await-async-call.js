"use strict";

const PROP = {
  ASYNC: "async",
  REPORT_IF_ASYNC: "report_if_async"
};

module.exports = function(context, assignmentRequired = false) {
  const allowThrow = context.options[0] === "allow-throw";
  const stack = [];

  // Push root-frame...
  stack.push({ level: 0, funcProps: {}, rememberedChildProps: {} });

  function setFuncProp(frame, funcId, propName, value) {
    const props = frame.funcProps;
    if (!(funcId in props)) {
      props[funcId] = {};
    }
    props[funcId][propName] = value;
  }

  function isFuncAsync(funcId) {
    // Go through stack and search backwards...
    for (let i = stack.length - 1; i >= 0; --i) {
      const props = stack[i].funcProps;
      if (funcId in props) {
        return props[funcId][PROP.ASYNC];
      }
    }
    return undefined;
  }

  function isFuncFailedIfAsync(funcId) {
    const checkProps = function(props, funcId) {
      if ((funcId in props) && (PROP.REPORT_IF_ASYNC in props[funcId])) {
        const reportIfAsync = props[funcId][PROP.REPORT_IF_ASYNC];
        if (reportIfAsync) {
          // Remove from props...
          delete props[funcId][PROP.REPORT_IF_ASYNC];
        }
        return reportIfAsync;
      }
      return undefined;
    };

    // Go through stack and search backwards...
    for (let i = stack.length - 1; i >= 0; --i) {
      const frame = stack[i];
      let reportIfAsync = checkProps(frame.funcProps, funcId);
      if (reportIfAsync === undefined) {
        reportIfAsync = checkProps(frame.rememberedChildProps, funcId);
      }
      if (reportIfAsync !== undefined) {
        return reportIfAsync;
      }
    }
    return undefined;
  }

  function onFunctionEnter(node) {
    const callingFrame = stack[stack.length - 1];
      const frame = {
        level: callingFrame.level + 1,
        isAsync: node.async,
        // Map to store if:
        // - PROP.ASYNC - Visited function declarations represent async functions
        // - PROP.REPORT_IF_ASYNC - Visited function calls within an async function
        // aren't awaited and thus shall report errors if later found out to be async.
        funcProps: {},
        rememberedChildProps: {}
      };
      stack.push(frame);
      let funcName;
      if (node.type === "FunctionDeclaration") {
        funcName = node.id.name;
      } else if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") {
        // Try to get function name...
        const parentType = node.parent ? node.parent.type : undefined;
        switch (parentType) {
          case "AssignmentExpression":
            if (node.parent.operator === "=" && node.parent.left.type === "Identifier") {
              funcName = node.parent.left.name;
            }
            break;
          case "VariableDeclarator":
            if (node.parent.id.type === "Identifier") {
              funcName = node.parent.id.name;
            }
            break;
        }
      }

      if (funcName) {
        setFuncProp(callingFrame, funcName, PROP.ASYNC, node.async || false);
        if (node.async) {
          const reportNodeIfAsync = isFuncFailedIfAsync(funcName);
          if (reportNodeIfAsync) {
            context.report({
              node: reportNodeIfAsync,
              message: assignmentRequired ? "Call to async function without await on assignment" : "Call to async function without await",
            });
          }
        }
      }
    }

    function onFunctionExit(node) {
      const frame = stack.pop();
      const callingFrame = stack[stack.length - 1];
      // Check funcProps if we shall save any...
      const propsToRemember = {};
      for (const funcName of Object.keys(frame.funcProps)) {
        const props = frame.funcProps[funcName];
        if (PROP.REPORT_IF_ASYNC in props) {
          propsToRemember[funcName] = props;
        }
      }
      Object.assign(callingFrame.rememberedChildProps, frame.rememberedChildProps, propsToRemember);
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
        const parentIsAwait = node.parent && node.parent.type === "AwaitExpression";
        const parentIsAssign = node.parent && ([ "AssignmentExpression", "VariableDeclarator" ].indexOf(node.parent.type) !== -1);
        const calledFunctionName = node.callee.name;
        if (assignmentRequired ? parentIsAssign : !parentIsAwait) {
          // That is called without await...
          const calledFuncIsAsync = isFuncAsync(calledFunctionName);
          if (calledFuncIsAsync === undefined) {
            const callingFrame = stack[stack.length - 2];
            // We don't know yet if called function is async...
            setFuncProp(callingFrame, calledFunctionName, PROP.REPORT_IF_ASYNC, node);
          } else if (calledFuncIsAsync) {
            context.report({
              node: node,
              message: assignmentRequired ? "Call to async function without await on assignment" : "Call to async function without await",
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
