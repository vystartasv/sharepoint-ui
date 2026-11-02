import ts from "typescript";
import { readFile } from "node:fs/promises";

const sourcePath = new URL("../packages/sharepoint-ui/src/react.tsx", import.meta.url);
const sourceText = await readFile(sourcePath, "utf8");
const source = ts.createSourceFile(sourcePath.pathname, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const components = [];

function visitWithoutNestedFunctions(node, visitor) {
  visitor(node);
  if (node !== source && (ts.isFunctionLike(node) || ts.isArrowFunction(node))) return;
  ts.forEachChild(node, child => visitWithoutNestedFunctions(child, visitor));
}

function isExported(node) {
  return Boolean(node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

for (const statement of source.statements) {
  if (ts.isFunctionDeclaration(statement) && statement.name && isExported(statement) && statement.body) {
    let forwarded = false;
    const rootTags = new Set();
    let internalRefs = 0;
    visitWithoutNestedFunctions(statement.body, node => {
      if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "useRef" && node.expression.expression.getText(source) === "React") internalRefs++;
      if (ts.isReturnStatement(node) && node.expression) {
        visitWithoutNestedFunctions(node.expression, returned => {
          if (!ts.isCallExpression(returned) || returned.arguments.length === 0) return;
          const factory = returned.expression;
          const isCreateElement = ts.isPropertyAccessExpression(factory) && factory.name.text === "createElement" && factory.expression.getText(source) === "React";
          const tag = returned.arguments[0];
          if (isCreateElement && ts.isStringLiteral(tag) && tag.text.startsWith("spui-")) rootTags.add(tag.text);
        });
      }
    });
    components.push({ name: statement.name.text, rootTags, internalRefs, forwarded });
  } else if (ts.isVariableStatement(statement) && isExported(statement)) {
    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
      let initializer = declaration.initializer;
      while (ts.isAsExpression(initializer) || ts.isTypeAssertionExpression(initializer) || ts.isParenthesizedExpression(initializer)) initializer = initializer.expression;
      if (!ts.isCallExpression(initializer)) continue;
      const factory = initializer.expression;
      if (!ts.isPropertyAccessExpression(factory) || factory.name.text !== "forwardRef" || factory.expression.getText(source) !== "React") continue;
      const name = declaration.name.text;
      const functionBody = initializer.arguments.find(ts.isFunctionExpression)?.body;
      let rootTags = new Set();
      let internalRefs = 0;
      if (functionBody) visitWithoutNestedFunctions(functionBody, node => {
        if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "useRef" && node.expression.expression.getText(source) === "React") internalRefs++;
        if (ts.isReturnStatement(node) && node.expression) visitWithoutNestedFunctions(node.expression, returned => {
          if (!ts.isCallExpression(returned) || returned.arguments.length === 0) return;
          const callee = returned.expression;
          const isCreateElement = ts.isPropertyAccessExpression(callee) && callee.name.text === "createElement" && callee.expression.getText(source) === "React";
          const tag = returned.arguments[0];
          if (isCreateElement && ts.isStringLiteral(tag) && tag.text.startsWith("spui-")) rootTags.add(tag.text);
        });
      });
      components.push({ name, rootTags, internalRefs, forwarded: true });
    }
  }
}

const singleHost = components.filter(component => component.rootTags.size === 1);
const withoutRef = singleHost.filter(component => !component.forwarded);
const easyCandidates = withoutRef.filter(component => component.internalRefs === 0);
const refExceptions = withoutRef.filter(component => component.internalRefs > 0);
console.log(`React adapter export inventory: ${components.length} components, hooks, and utility functions`);
console.log(`Forwarded refs: ${components.filter(component => component.forwarded).length}`);
console.log(`Single-host components without forwarded refs: ${withoutRef.length}`);
console.log(`  No internal useRef: ${easyCandidates.length}`);
console.log(`  Internal useRef needs ref composition review: ${refExceptions.length}`);
console.log(`Other/compound/API exports: ${components.length - singleHost.length}`);
if (easyCandidates.length) console.log(`Easy candidates: ${easyCandidates.map(component => `${component.name} (${[...component.rootTags][0]})`).join(", ")}`);
if (refExceptions.length) console.log(`Internal-ref candidates: ${refExceptions.map(component => `${component.name} (${[...component.rootTags][0]}, ${component.internalRefs} useRef)`).join(", ")}`);
