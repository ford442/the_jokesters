#!/usr/bin/env node
/**
 * One-off codemod: rewrite `ctx.manager.chatForAgent(...)` call sites (and their
 * `onTurnStart`/`onTurnEnd` wrappers) into `chatForAgentWithComedy(ctx, ...)` so
 * every agent turn registers with ComedySession (callbacks + quality gate).
 *
 * Usage: node scripts/codemods/wire-comedy-helpers.cjs <file1> <file2> ...
 */
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const HELPER_IMPORT = "import { chatForAgentWithComedy } from '../../comedy/comedyModeHelpers';";

function isChatForAgentCall(node) {
  if (!ts.isCallExpression(node)) return null;
  const expr = node.expression;
  if (!ts.isPropertyAccessExpression(expr)) return null;
  if (expr.name.text !== 'chatForAgent') return null;
  // object must be `ctx.manager` or a bare identifier alias (verified upstream to
  // always originate from `ctx.manager` in this codebase).
  const objText = expr.expression.getText();
  if (objText !== 'ctx.manager' && !/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(objText)) return null;
  if (node.arguments.length < 3) return null;
  return node;
}

function isTurnStartFor(node, agentText) {
  if (!ts.isExpressionStatement(node)) return false;
  let expr = node.expression;
  if (ts.isAwaitExpression(expr)) expr = expr.expression;
  if (!ts.isCallExpression(expr)) return false;
  if (!ts.isPropertyAccessExpression(expr.expression)) return false;
  if (expr.expression.name.text !== 'onTurnStart') return false;
  if (expr.arguments.length !== 1) return false;
  return expr.arguments[0].getText() === agentText;
}

function isTurnEnd(node) {
  if (!ts.isExpressionStatement(node)) return false;
  let expr = node.expression;
  if (ts.isAwaitExpression(expr)) expr = expr.expression;
  if (!ts.isCallExpression(expr)) return false;
  if (!ts.isPropertyAccessExpression(expr.expression)) return false;
  return expr.expression.name.text === 'onTurnEnd';
}

function processFile(filePath) {
  const sourceText = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.ES2022, true);

  const edits = [];
  let matchCount = 0;

  function visitStatementArray(statements) {
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!ts.isExpressionStatement(stmt)) continue;
      let expr = stmt.expression;
      if (ts.isAwaitExpression(expr)) expr = expr.expression;
      const call = isChatForAgentCall(expr);
      if (!call) continue;

      matchCount++;
      const [agentArg, promptArg, cbArg, extraArg] = call.arguments;
      const agentText = agentArg.getText();
      const promptText = promptArg.getText();
      const cbText = cbArg.getText();
      const extraText = extraArg ? extraArg.getText() : null;

      let startNode = stmt;
      let endNode = stmt;

      const prev = statements[i - 1];
      if (prev && isTurnStartFor(prev, agentText)) {
        startNode = prev;
      }
      const next = statements[i + 1];
      if (next && isTurnEnd(next)) {
        endNode = next;
      }

      const optionsArg = extraText ? `, { chatOptions: ${extraText} }` : '';
      const replacement = `await chatForAgentWithComedy(ctx, ${agentText}, ${promptText}, ${cbText}${optionsArg});`;

      edits.push({
        start: startNode.getStart(sourceFile),
        end: endNode.getEnd(),
        text: replacement,
      });
    }
  }

  function visit(node) {
    if (ts.isBlock(node) || ts.isSourceFile(node)) {
      visitStatementArray(node.statements);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  if (edits.length === 0) {
    return { filePath, matchCount: 0, editCount: 0 };
  }

  edits.sort((a, b) => b.start - a.start);
  let out = sourceText;
  for (const edit of edits) {
    out = out.slice(0, edit.start) + edit.text + out.slice(edit.end);
  }

  if (!out.includes("comedyModeHelpers")) {
    const lastImportMatch = [...out.matchAll(/^import .*;$/gm)].pop();
    if (lastImportMatch) {
      const insertAt = lastImportMatch.index + lastImportMatch[0].length;
      out = out.slice(0, insertAt) + '\n' + HELPER_IMPORT + out.slice(insertAt);
    } else {
      out = HELPER_IMPORT + '\n' + out;
    }
  }

  fs.writeFileSync(filePath, out, 'utf8');
  return { filePath, matchCount, editCount: edits.length };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('Usage: node wire-comedy-helpers.cjs <file1> <file2> ...');
  process.exit(1);
}

for (const f of files) {
  const abs = path.resolve(f);
  const result = processFile(abs);
  console.log(`${result.filePath}: ${result.editCount} edits (of ${result.matchCount} chatForAgent calls found)`);
}
