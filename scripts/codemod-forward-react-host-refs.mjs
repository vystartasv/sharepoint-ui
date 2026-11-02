import ts from "typescript";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const sourcePath = resolve(root, "packages/sharepoint-ui/src/react.tsx");
const catalogPath = resolve(root, "packages/sharepoint-ui/components.json");
const sourceText = await readFile(sourcePath, "utf8");
const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const catalogByName = new Map(catalog.components.map(component => [component.react, component]));
const edits = [];
const skipped = [];
const changedNames = [];

function visitWithoutNestedFunctions(node, visitor) {
  visitor(node);
  if (node !== source && (ts.isFunctionLike(node) || ts.isArrowFunction(node))) return;
  ts.forEachChild(node, child => visitWithoutNestedFunctions(child, visitor));
}

function isExported(node) {
  return Boolean(node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function collectReturnRoots(body) {
  const roots = [];
  visitWithoutNestedFunctions(body, node => {
    if (!ts.isReturnStatement(node) || !node.expression) return;
    visitWithoutNestedFunctions(node.expression, returned => {
      if (!ts.isCallExpression(returned) || returned.arguments.length < 2) return;
      const callee = returned.expression;
      if (!ts.isPropertyAccessExpression(callee) || callee.name.text !== "createElement" || callee.expression.getText(source) !== "React") return;
      const tag = returned.arguments[0];
      if (ts.isStringLiteral(tag) && tag.text.startsWith("spui-")) roots.push({ call: returned, tag: tag.text });
    });
  });
  return roots;
}

for (const statement of source.statements) {
  if (!ts.isFunctionDeclaration(statement) || !statement.name || !statement.body || !isExported(statement)) continue;
  const name = statement.name.text;
  if (!catalogByName.has(name)) continue;
  const component = catalogByName.get(name);
  if (component.api.reactRefType) continue;
  if (statement.parameters.length !== 1 || !statement.parameters[0].type) { skipped.push(`${name}: needs one explicitly typed parameter`); continue; }
  let internalRefs = false;
  visitWithoutNestedFunctions(statement.body, node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "useRef" && node.expression.expression.getText(source) === "React") internalRefs = true;
  });
  if (internalRefs) { skipped.push(`${name}: internal ref requires composition`); continue; }
  const roots = collectReturnRoots(statement.body);
  const uniqueTags = new Set(roots.map(root => root.tag));
  if (uniqueTags.size !== 1 || roots.length !== 1) { skipped.push(`${name}: root host is not unambiguous`); continue; }
  const rootCall = roots[0].call;
  const propsCall = rootCall.arguments[1];
  if (!ts.isCallExpression(propsCall) || !ts.isIdentifier(propsCall.expression) || !["useCustomElementProps", "useHostProps"].includes(propsCall.expression.text) || propsCall.arguments.length !== 1) {
    skipped.push(`${name}: root props use an unsupported path`); continue;
  }
  const propsArgument = propsCall.arguments[0];
  if (!ts.isObjectLiteralExpression(propsArgument) && !ts.isIdentifier(propsArgument)) { skipped.push(`${name}: root props are not a plain object`); continue; }
  if (ts.isObjectLiteralExpression(propsArgument) && propsArgument.properties.some(property => ts.isPropertyAssignment(property) && property.name.getText(source).replaceAll(/["']/g, "") === "ref")) {
    skipped.push(`${name}: root already defines a ref`); continue;
  }

  const parameter = statement.parameters[0];
  const parameterType = parameter.type.getText(source);
  const openParen = sourceText.indexOf("(", statement.name.end);
  const insertForwardedRef = parameter.end;
  edits.push({ start: statement.getStart(source), end: statement.getStart(source) + "export function".length, text: "export const" });
  edits.push({ start: openParen, end: openParen, text: ` = React.forwardRef<HTMLElement, ${parameterType}>(function ${name}` });
  edits.push({ start: insertForwardedRef, end: insertForwardedRef, text: ", forwardedRef" });
  edits.push({ start: statement.end - 1, end: statement.end, text: "});" });
  if (ts.isObjectLiteralExpression(propsArgument)) {
    const openBrace = propsArgument.getStart(source) + 1;
    edits.push({ start: openBrace, end: openBrace, text: " ref: forwardedRef," });
  } else {
    edits.push({ start: propsArgument.getStart(source), end: propsArgument.end, text: `{ ...${propsArgument.getText(source)}, ref: forwardedRef }` });
  }
  component.api.reactRefType = "HTMLElement";
  changedNames.push(name);
}

console.log(`React host-ref codemod: ${changedNames.length} safe adapter candidates; ${skipped.length} skipped for manual review.`);
console.log(`Candidates: ${changedNames.join(", ")}`);
if (skipped.length) console.log(`Skipped: ${skipped.join("; ")}`);

if (process.argv.includes("--write")) {
  const transformed = edits.sort((a, b) => b.start - a.start).reduce((text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end), sourceText);
  const validation = ts.createSourceFile(sourcePath, transformed, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (validation.parseDiagnostics.length) throw new Error(`Codemod produced invalid TSX: ${validation.parseDiagnostics.map(diagnostic => diagnostic.messageText).join("; ")}`);
  await writeFile(sourcePath, transformed);
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log("Updated React adapters and catalog metadata.");
}
