import ts from "typescript";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const path = resolve("packages/sharepoint-ui/src/react.tsx");
const source = await readFile(path, "utf8");
const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const roots = [];

function visit(node) {
  if (ts.isCallExpression(node)
    && node.expression.getText(file) === "React.createElement"
    && ts.isStringLiteral(node.arguments[0])
    && node.arguments[0].text.startsWith("spui-")) {
    roots.push({
      tag: node.arguments[0].text,
      props: node.arguments[1],
      line: file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1,
    });
  }
  ts.forEachChild(node, visit);
}

visit(file);
const gaps = roots.filter(({ props }) => !props
  || !ts.isCallExpression(props)
  || !["useCustomElementProps", "customElementProps", "nativeControlHostProps"].includes(props.expression.getText(file)));

if (gaps.length) {
  throw new Error(`React custom-element roots must normalize className to class:\n${gaps.map(({ tag, line }) => `  ${tag} at line ${line}`).join("\n")}`);
}

console.log(`Checked ${roots.length} React custom-element roots: className is normalized on all roots.`);
