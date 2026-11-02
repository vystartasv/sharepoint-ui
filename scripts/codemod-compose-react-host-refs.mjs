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
const changedNames = [];
const skipped = [];

function visitWithoutNestedFunctions(node, visitor) {
  visitor(node);
  if (node !== source && (ts.isFunctionLike(node) || ts.isArrowFunction(node))) return;
  ts.forEachChild(node, child => visitWithoutNestedFunctions(child, visitor));
}

for (const statement of source.statements) {
  if (!ts.isFunctionDeclaration(statement) || !statement.name || !statement.body || !statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
  const name = statement.name.text;
  const component = catalogByName.get(name);
  if (!component || component.api.reactRefType || statement.typeParameters?.length || statement.parameters.length !== 1 || !statement.parameters[0].type) continue;

  const refs = [];
  const roots = [];
  visitWithoutNestedFunctions(statement.body, node => {
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "ref" && node.initializer && ts.isCallExpression(node.initializer) && ts.isPropertyAccessExpression(node.initializer.expression) && node.initializer.expression.name.text === "useRef" && node.initializer.expression.expression.getText(source) === "React") refs.push(node);
    if (ts.isReturnStatement(node) && node.expression) visitWithoutNestedFunctions(node.expression, returned => {
      if (ts.isCallExpression(returned) && ts.isPropertyAccessExpression(returned.expression) && returned.expression.name.text === "createElement" && returned.expression.expression.getText(source) === "React" && ts.isStringLiteral(returned.arguments[0]) && returned.arguments[0].text.startsWith("spui-")) roots.push(returned);
    });
  });
  if (refs.length !== 1) { skipped.push(`${name}: expected one local host ref`); continue; }
  if (roots.length !== 1) { skipped.push(`${name}: expected one direct host return`); continue; }
  const rootPropsCall = roots[0].arguments[1];
  if (!rootPropsCall || !ts.isCallExpression(rootPropsCall) || !["useCustomElementProps", "useHostProps"].includes(rootPropsCall.expression.getText(source)) || !ts.isObjectLiteralExpression(rootPropsCall.arguments[0])) {
    skipped.push(`${name}: host ref is not in a direct custom-element props object`); continue;
  }
  const hostRef = rootPropsCall.arguments[0].properties.find(property => ts.isShorthandPropertyAssignment(property) && property.name.text === "ref" || ts.isPropertyAssignment(property) && property.name.getText(source).replaceAll(/["']/g, "") === "ref" && property.initializer.getText(source) === "ref");
  if (!hostRef) { skipped.push(`${name}: local ref is not assigned to the host`); continue; }

  const parameter = statement.parameters[0];
  const parameterType = parameter.type.getText(source);
  const openParen = sourceText.indexOf("(", statement.name.end);
  edits.push({ start: statement.getStart(source), end: statement.getStart(source) + "export function".length, text: "export const" });
  edits.push({ start: openParen, end: openParen, text: ` = React.forwardRef<HTMLElement, ${parameterType}>(function ${name}` });
  edits.push({ start: parameter.end, end: parameter.end, text: ", forwardedRef" });
  edits.push({ start: statement.end - 1, end: statement.end, text: "});" });
  edits.push({ start: refs[0].end, end: refs[0].end, text: "\n  useExposeHostRef(ref, forwardedRef);" });
  component.api.reactRefType = "HTMLElement";
  changedNames.push(name);
}

console.log(`React internal-ref codemod: ${changedNames.length} composable adapter roots; ${skipped.length} skipped for manual review.`);
console.log(`Candidates: ${changedNames.join(", ")}`);
if (skipped.length) console.log(`Skipped: ${skipped.join("; ")}`);

if (process.argv.includes("--write")) {
  const transformed = edits.sort((a, b) => b.start - a.start).reduce((text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end), sourceText);
  const validation = ts.createSourceFile(sourcePath, transformed, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  if (validation.parseDiagnostics.length) throw new Error(`Codemod produced invalid TSX: ${validation.parseDiagnostics.map(diagnostic => diagnostic.messageText).join("; ")}`);
  const helper = `function useExposeHostRef<T extends HTMLElement>(localRef: React.RefObject<T | null>, forwardedRef: React.ForwardedRef<HTMLElement>): void {\n  React.useImperativeHandle(forwardedRef, () => localRef.current!, [localRef]);\n}\n\n`;
  const helperMarker = "function getActiveMotionAnimations(";
  const helperIndex = transformed.indexOf(helperMarker);
  if (helperIndex < 0) throw new Error("Could not locate React helper insertion point");
  await writeFile(sourcePath, transformed.slice(0, helperIndex) + helper + transformed.slice(helperIndex));
  await writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log("Updated internal-ref adapters and catalog metadata.");
}
