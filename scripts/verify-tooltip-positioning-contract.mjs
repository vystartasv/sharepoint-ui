import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import ts from "typescript";

const root = process.cwd();
const fluentRoot = resolve(root, "examples/spfx124-webpart/node_modules");
const require = createRequire(resolve(fluentRoot, "@fluentui/react-positioning/package.json"));
const fluentFile = resolve(dirname(require.resolve("@fluentui/react-positioning/package.json")), "dist/index.d.ts");
const localFile = resolve(root, "packages/sharepoint-ui/src/elements/tooltip.ts");
const program = ts.createProgram([fluentFile, localFile], {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  strict: true,
  skipLibCheck: true,
  baseUrl: root,
  paths: { "*": [resolve(fluentRoot, "*")] },
  typeRoots: [resolve(fluentRoot, "@types")],
});
const checker = program.getTypeChecker();
const exportedType = (file, name) => {
  const source = program.getSourceFile(file);
  const module = source && checker.getSymbolAtLocation(source);
  const symbol = module && checker.getExportsOfModule(module).find(item => item.name === name);
  const declaration = symbol?.declarations?.[0];
  return declaration && checker.getTypeAtLocation(declaration);
};
const fluent = exportedType(fluentFile, "PositioningShorthand");
const local = exportedType(localFile, "TooltipPositioning");
assert.ok(fluent && local, "both positioning contracts resolve");
const fluentParts = fluent.isUnion() ? fluent.types : [fluent];
const localParts = local.isUnion() ? local.types : [local];
const localStrings = checker.getUnionType(localParts.filter(part => part.flags & ts.TypeFlags.StringLike));
const optionsPart = localParts.find(part => part.flags & ts.TypeFlags.Object);
assert.ok(localStrings && optionsPart, "Tooltip exposes both shorthand and object positioning forms");
const missingStrings = fluentParts.filter(part => part.flags & ts.TypeFlags.StringLike && !checker.isTypeAssignableTo(part, localStrings));
const missingOptions = fluentParts.filter(part => part.flags & ts.TypeFlags.Object && !checker.isTypeAssignableTo(part, optionsPart));
if (missingOptions.length) {
  console.error(checker.getPropertiesOfType(missingOptions[0]).flatMap(property => {
    const localProperty = checker.getPropertyOfType(optionsPart, property.name);
    if (!localProperty) return [`missing ${property.name}`];
    const node = property.valueDeclaration ?? property.declarations?.[0];
    const localNode = localProperty.valueDeclaration ?? localProperty.declarations?.[0];
    const expected = checker.getTypeOfSymbolAtLocation(property, node);
    const actual = checker.getTypeOfSymbolAtLocation(localProperty, localNode);
    return checker.isTypeAssignableTo(expected, actual) ? [] : [`incompatible ${property.name}: ${checker.typeToString(expected)} => ${checker.typeToString(actual)}`];
  }).join("\n"));
}
assert.equal(missingStrings.length, 0, `all Fluent positioning shorthand values are accepted; missing ${missingStrings.map(part => checker.typeToString(part)).join(", ")}`);
assert.equal(missingOptions.length, 0, `all Fluent positioning options are accepted; missing ${missingOptions.map(part => checker.typeToString(part)).join(", ")}`);

console.log(JSON.stringify({ status: "passed", fluentContract: "PositioningShorthand", localContract: "TooltipPositioning", fluentValuesAccepted: true }));
