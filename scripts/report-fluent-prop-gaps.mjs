import { readFile, readdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fluentRoot = resolve(root, "examples/spfx124-webpart/node_modules");
const resolveFluentDependency = createRequire(resolve(fluentRoot, "@fluentui/react-components/package.json"));
const localParameterTypes = new Map();
const fluentPackageOverrides = {
  "input/SearchBox": "@fluentui/react-search",
  "list/DataGrid": "@fluentui/react-table",
  "table/ColumnIdContextProvider": "@fluentui/react-table",
  "table/createTableColumn": "@fluentui/react-table",
  "table/useDataGridContext_unstable": "@fluentui/react-table",
  "table/useTableFeatures": "@fluentui/react-table",
  "table/useTableSelection": "@fluentui/react-table",
  "table/useTableSort": "@fluentui/react-table",
  "table/useTableColumnSizing_unstable": "@fluentui/react-table",
  "table/useTableCompositeNavigation": "@fluentui/react-table",
  "toast/useToastController": "@fluentui/react-toast",
};
const nonComponentContracts = new Map([
  ["table/createTableColumn", "Generic column factory utility; it does not accept component props."],
  ["table/useDataGridContext_unstable", "React hook utility; it selects from this library's composed DataGrid context."],
  ["table/useTableFeatures", "React hook utility; it composes table state and feature plugins rather than rendering a component."],
  ["table/useTableSelection", "React hook plugin factory; it adds row selection state to useTableFeatures."],
  ["table/useTableSort", "React hook plugin factory; it adds sorting state to useTableFeatures."],
  ["table/useTableColumnSizing_unstable", "React hook plugin factory; it adds measured column widths and resize behavior to useTableFeatures."],
  ["table/useTableCompositeNavigation", "React keyboard-navigation utility; it supplies grid/row Tabster attributes and table focus handoff behavior."],
  ["toast/useToastController", "React hook utility; its parameters are not component props."],
  ["overflow/useOverflowSnapshot", "React hook utility; it selects a value from the latest overflow snapshot."],
  ["overflow/OverflowReorderObserver", "Renderless overflow utility; this library's native overflow engine observes child-list mutations directly."],
]);
const [baseline, catalog] = await Promise.all([
  readFile(resolve(root, "investigation/fluent-v9-catalog-9.75.0.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "packages/sharepoint-ui/components.json"), "utf8").then(JSON.parse),
]);

async function sourceFiles(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) result.push(...await sourceFiles(path));
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".d.ts")) result.push(path);
  }
  return result;
}
function namesInType(node) {
  const result = new Map();
  const visit = type => {
    if (!type) return;
    if (ts.isParenthesizedTypeNode(type)) return visit(type.type);
    if (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type)) return type.types.forEach(visit);
    if (ts.isTypeLiteralNode(type)) {
      for (const member of type.members) {
        if (!member.name) continue;
        const name = member.name.getText().replace(/^['"]|['"]$/g, "");
        if (ts.isPropertySignature(member) || ts.isMethodSignature(member)) result.set(name, Boolean(member.questionToken));
      }
      return;
    }
  };
  visit(node);
  return result;
}
function buildAliases(sourceFile) {
  const aliases = new Map();
  for (const statement of sourceFile.statements) if (ts.isTypeAliasDeclaration(statement)) aliases.set(statement.name.text, statement.type);
  return aliases;
}
function buildFluentAliases(sourceFile, fluentFiles, seen = new Set()) {
  if (!sourceFile || seen.has(sourceFile.fileName)) return new Map();
  const nextSeen = new Set(seen).add(sourceFile.fileName);
  const aliases = buildAliases(sourceFile);
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || !statement.importClause?.namedBindings || !ts.isNamedImports(statement.importClause.namedBindings)) continue;
    const dependency = fluentFiles.find(([packageName]) => packageName === statement.moduleSpecifier.text)?.[2];
    if (!dependency) continue;
    const dependencyAliases = buildFluentAliases(dependency, fluentFiles, nextSeen);
    for (const element of statement.importClause.namedBindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text;
      const localName = element.name.text;
      if (!aliases.has(localName) && dependencyAliases.has(importedName)) aliases.set(localName, dependencyAliases.get(importedName));
    }
  }
  return aliases;
}
function literalKeys(type) {
  if (!type) return [];
  if (ts.isParenthesizedTypeNode(type)) return literalKeys(type.type);
  if (ts.isUnionTypeNode(type)) return type.types.flatMap(literalKeys);
  if (ts.isLiteralTypeNode(type) && ts.isStringLiteral(type.literal)) return [type.literal.text];
  return [];
}
function applyPickOmit(names, type, name) {
  const selected = new Set(type.typeArguments?.slice(1).flatMap(literalKeys) ?? []);
  if (!selected.size) return names;
  return new Set([...names].filter(prop => name === "Pick" ? selected.has(prop) : !selected.has(prop)));
}
function slotPropNames(type, aliases, depth = 0, seen = new Set()) {
  if (!type || depth > 8) return new Set();
  if (ts.isParenthesizedTypeNode(type)) return slotPropNames(type.type, aliases, depth + 1, seen);
  if (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type)) return new Set(type.types.flatMap(node => [...slotPropNames(node, aliases, depth + 1, seen)]));
  if (!ts.isTypeReferenceNode(type)) {
    if (!ts.isTypeLiteralNode(type)) return new Set();
    return new Set(type.members.flatMap(member => member.name ? [member.name.getText().replace(/^['"]|['"]$/g, "")] : []));
  }
  const name = type.typeName.getText();
  if (name === "Pick" || name === "Omit") return applyPickOmit(slotPropNames(type.typeArguments?.[0], aliases, depth + 1, seen), type, name);
  if (name === "Partial" || name === "Required" || name === "Readonly") return slotPropNames(type.typeArguments?.[0], aliases, depth + 1, seen);
  if (seen.has(name)) return new Set();
  const alias = aliases.get(name);
  return alias ? slotPropNames(alias, aliases, depth + 1, new Set(seen).add(name)) : new Set();
}
function componentSlotProps(type, aliases, depth = 0, seen = new Set()) {
  if (!type || depth > 8) return new Set();
  if (ts.isParenthesizedTypeNode(type)) return componentSlotProps(type.type, aliases, depth + 1, seen);
  if (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type)) return new Set(type.types.flatMap(node => [...componentSlotProps(node, aliases, depth + 1, seen)]));
  if (!ts.isTypeReferenceNode(type)) return new Set();
  const name = type.typeName.getText();
  if (name === "ComponentProps") {
    const primarySlot = literalKeys(type.typeArguments?.[1])[0] ?? "root";
    return new Set([...slotPropNames(type.typeArguments?.[0], aliases, depth + 1)].filter(prop => prop !== "root" && prop !== primarySlot));
  }
  if (name === "Pick" || name === "Omit") return applyPickOmit(componentSlotProps(type.typeArguments?.[0], aliases, depth + 1, seen), type, name);
  if (name === "Partial" || name === "Required" || name === "Readonly") return componentSlotProps(type.typeArguments?.[0], aliases, depth + 1, seen);
  if (seen.has(name)) return new Set();
  const alias = aliases.get(name);
  return alias ? componentSlotProps(alias, aliases, depth + 1, new Set(seen).add(name)) : new Set();
}
function propsFromType(type, aliases, depth = 0, seen = new Set()) {
  if (!type || depth > 8) return new Map();
  if (ts.isParenthesizedTypeNode(type)) return propsFromType(type.type, aliases, depth + 1, seen);
  if (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type)) return new Map(type.types.flatMap(node => [...propsFromType(node, aliases, depth + 1, seen)]));
  const direct = namesInType(type);
  if (direct.size) return direct;
  if (ts.isIndexedAccessTypeNode(type) && ts.isLiteralTypeNode(type.indexType) && ts.isNumericLiteral(type.indexType.literal) && type.indexType.literal.text === "0" && ts.isTypeReferenceNode(type.objectType) && type.objectType.typeName.getText() === "Parameters") {
    const target = type.objectType.typeArguments?.[0];
    if (target && ts.isTypeQueryNode(target) && ts.isIdentifier(target.exprName)) return propsFromType(localParameterTypes.get(target.exprName.text)?.[0], aliases, depth + 1, seen);
  }
  if (!ts.isTypeReferenceNode(type)) return new Map();
  const name = type.typeName.getText();
  if (name.endsWith("ComponentProps")) {
    const target = type.typeArguments?.[0];
    if (target && ts.isTypeQueryNode(target) && ts.isIdentifier(target.exprName)) return propsFromType(localParameterTypes.get(target.exprName.text)?.[0], aliases, depth + 1, seen);
    if (name === "ComponentProps") return new Map();
  }
  if (name === "ElementProps" || name.endsWith("ComponentProps") || name === "HTMLAttributes" || name === "HTMLButtonProps" || name === "Slot" || seen.has(name)) return new Map();
  const nextSeen = new Set(seen).add(name);
  if (name === "Omit" && type.typeArguments?.length) {
    const props = propsFromType(type.typeArguments[0], aliases, depth + 1, nextSeen);
    for (const excluded of type.typeArguments.slice(1).flatMap(node => ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal) ? [node.literal.text] : ts.isUnionTypeNode(node) ? node.types.filter(ts.isLiteralTypeNode).map(item => item.literal.text) : [])) props.delete(excluded);
    return props;
  }
  if (name === "Pick" && type.typeArguments?.length) {
    const props = propsFromType(type.typeArguments[0], aliases, depth + 1, nextSeen);
    const picked = new Set(type.typeArguments.slice(1).flatMap(node => ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal) ? [node.literal.text] : ts.isUnionTypeNode(node) ? node.types.filter(ts.isLiteralTypeNode).map(item => item.literal.text) : []));
    return new Map([...props].filter(([prop]) => picked.has(prop)));
  }
  const alias = aliases.get(name);
  return alias ? propsFromType(alias, aliases, depth + 1, nextSeen) : new Map();
}
function propertyTypesFromType(type, aliases, depth = 0, seen = new Set()) {
  if (!type || depth > 8) return new Map();
  if (ts.isParenthesizedTypeNode(type)) return propertyTypesFromType(type.type, aliases, depth + 1, seen);
  if (ts.isIntersectionTypeNode(type) || ts.isUnionTypeNode(type)) return new Map(type.types.flatMap(node => [...propertyTypesFromType(node, aliases, depth + 1, seen)]));
  if (ts.isTypeLiteralNode(type)) {
    const result = new Map();
    for (const member of type.members) if (ts.isPropertySignature(member) && member.name && member.type) {
      const name = member.name.getText().replace(/^['"]|['"]$/g, "");
      result.set(name, [member.type]);
    }
    return result;
  }
  if (!ts.isTypeReferenceNode(type)) return new Map();
  const name = type.typeName.getText();
  if (name.endsWith("ComponentProps")) {
    const target = type.typeArguments?.[0];
    if (target && ts.isTypeQueryNode(target) && ts.isIdentifier(target.exprName)) return propertyTypesFromType(localParameterTypes.get(target.exprName.text)?.[0], aliases, depth + 1, seen);
  }
  if (name === "ElementProps" || name.endsWith("ComponentProps") || name === "HTMLAttributes" || name === "HTMLButtonProps" || name === "Slot" || seen.has(name)) return new Map();
  const nextSeen = new Set(seen).add(name);
  if ((name === "Omit" || name === "Pick") && type.typeArguments?.length) {
    const props = propertyTypesFromType(type.typeArguments[0], aliases, depth + 1, nextSeen);
    const selected = new Set(type.typeArguments.slice(1).flatMap(node => ts.isLiteralTypeNode(node) && ts.isStringLiteral(node.literal) ? [node.literal.text] : ts.isUnionTypeNode(node) ? node.types.filter(item => ts.isLiteralTypeNode(item) && ts.isStringLiteral(item.literal)).map(item => item.literal.text) : []));
    if (name === "Omit") for (const excluded of selected) props.delete(excluded);
    else for (const prop of props.keys()) if (!selected.has(prop)) props.delete(prop);
    return props;
  }
  const alias = aliases.get(name);
  return alias ? propertyTypesFromType(alias, aliases, depth + 1, nextSeen) : new Map();
}
function literalValuesInType(type, aliases, depth = 0, seen = new Set()) {
  if (!type || depth > 8) return undefined;
  if (ts.isParenthesizedTypeNode(type)) return literalValuesInType(type.type, aliases, depth + 1, seen);
  if (ts.isLiteralTypeNode(type)) {
    const literal = type.literal;
    if (ts.isStringLiteral(literal) || ts.isNumericLiteral(literal)) return [literal.text];
    if (literal.kind === ts.SyntaxKind.TrueKeyword) return ["true"];
    if (literal.kind === ts.SyntaxKind.FalseKeyword) return ["false"];
    return undefined;
  }
  if (ts.isUnionTypeNode(type)) {
    const values = type.types.map(node => literalValuesInType(node, aliases, depth + 1, seen));
    return values.some(value => !value) ? undefined : [...new Set(values.flat())].sort();
  }
  if (ts.isIntersectionTypeNode(type)) {
    const values = type.types.map(node => literalValuesInType(node, aliases, depth + 1, seen));
    if (values.some(value => !value)) return undefined;
    return values.slice(1).reduce((shared, value) => shared.filter(item => value.includes(item)), values[0] ?? []);
  }
  if (ts.isIndexedAccessTypeNode(type) && ts.isLiteralTypeNode(type.indexType) && ts.isStringLiteral(type.indexType.literal)) {
    const properties = propertyTypesFromType(type.objectType, aliases, depth + 1, seen);
    return properties.has(type.indexType.literal.text) ? literalValuesInType(properties.get(type.indexType.literal.text)[0], aliases, depth + 1, seen) : undefined;
  }
  if (ts.isTypeReferenceNode(type)) {
    const name = type.typeName.getText();
    if (seen.has(name) || !aliases.has(name)) return undefined;
    return literalValuesInType(aliases.get(name), aliases, depth + 1, new Set(seen).add(name));
  }
  return undefined;
}
function literalPropsFromType(type, aliases) {
  const result = new Map();
  for (const [name, types] of propertyTypesFromType(type, aliases)) {
    const values = types.map(node => literalValuesInType(node, aliases));
    if (values.length && values.every(Boolean)) result.set(name, [...new Set(values.flat())].sort());
  }
  return result;
}
function walk(node, callback) { callback(node); ts.forEachChild(node, child => walk(child, callback)); }

function getFluentOwnProps(source, componentName) {
  if (!source) return undefined;
  const aliases = buildAliases(source);
  const publicNames = new Map();
  walk(source, node => {
    if (!ts.isExportDeclaration(node) || !node.exportClause || !ts.isNamedExports(node.exportClause)) return;
    for (const element of node.exportClause.elements) publicNames.set(element.propertyName?.getText(source) ?? element.name.getText(source), element.name.getText(source));
  });
  let resolved;
  let resolvedType;
  walk(source, node => {
    if (resolved || !ts.isVariableDeclaration(node) || !node.name || !node.type) return;
    const declaredName = node.name.getText();
    if ((publicNames.get(declaredName) ?? declaredName) !== componentName) return;
    const declarationText = node.type.getText(source);
    if (/\bProvider\s*</.test(declarationText)) {
      resolved = new Map([["value", false]]);
      resolvedType = undefined;
      return;
    }
    if (/\bFC\s*<\s*ProviderProps\s*</.test(declarationText)) {
      resolved = new Map([["value", false]]);
      resolvedType = undefined;
      return;
    }
    const componentType = node.type;
    walk(componentType, part => {
      if (resolved || !ts.isTypeReferenceNode(part) || !/(?:ForwardRefComponent|ForwardRefExoticComponent|FunctionComponent|FC)$/.test(part.typeName.getText()) || !part.typeArguments?.length) return;
      resolvedType = part.typeArguments[0];
      resolved = propsFromType(resolvedType, aliases);
    });
  });
  if (resolved) return { props: resolved, type: resolvedType };
  walk(source, node => {
    if (resolved || !ts.isFunctionDeclaration(node) || !node.name || node.name.text !== componentName) return;
    const firstParameter = node.parameters[0];
    resolvedType = firstParameter?.type;
    resolved = resolvedType ? propsFromType(resolvedType, aliases) : new Map();
  });
  return resolved ? { props: resolved, type: resolvedType } : undefined;
}

const fluentPackageOverridesByComponent = new Map(Object.entries(fluentPackageOverrides));
const fluentPackageNames = [...new Set([...baseline.families.map(family => family.package), ...Object.values(fluentPackageOverrides)])];

const [localPaths, fluentFiles] = await Promise.all([
  sourceFiles(resolve(root, "packages/sharepoint-ui/src")),
  Promise.all(fluentPackageNames.map(async packageName => {
    let packagePath;
    try { packagePath = resolveFluentDependency.resolve(`${packageName}/package.json`); }
    catch { packagePath = resolve(fluentRoot, packageName, "package.json"); }
    const path = resolve(packagePath, "..", "dist/index.d.ts");
    try { return [packageName, path, ts.createSourceFile(path, await readFile(path, "utf8"), ts.ScriptTarget.Latest, true)]; }
    catch { return [packageName, path, undefined]; }
  })),
]);
const localFiles = await Promise.all(localPaths.map(async path => [path, ts.createSourceFile(path, await readFile(path, "utf8"), ts.ScriptTarget.Latest, true)]));
const localAliases = new Map();
for (const [, file] of localFiles) for (const [name, type] of buildAliases(file)) if (!localAliases.has(name)) localAliases.set(name, type);
const localFunctions = new Map();
for (const [, file] of localFiles) walk(file, node => {
  if (ts.isFunctionDeclaration(node) && node.name && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
    localFunctions.set(node.name.text, node.parameters[0]?.type);
    localParameterTypes.set(node.name.text, node.parameters.map(parameter => parameter.type));
    return;
  }
  if (!ts.isVariableDeclaration(node) || !ts.isIdentifier(node.name) || !node.initializer || !ts.isVariableStatement(node.parent.parent) || !node.parent.parent.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) return;
  const componentName = node.name.text;
  let componentParameters;
  walk(node.initializer, part => {
    if (componentParameters || (!ts.isFunctionExpression(part) && !ts.isArrowFunction(part))) return;
    if (ts.isFunctionExpression(part) && part.name && part.name.text !== componentName) return;
    if (!part.parameters.length) return;
    componentParameters = part.parameters.map(parameter => parameter.type);
  });
  if (componentParameters) {
    localFunctions.set(componentName, componentParameters[0]);
    localParameterTypes.set(componentName, componentParameters);
  }
});
const localByName = new Map(catalog.components.map(component => [component.react, component]));
const equivalents = { combobox: { Combobox: "ComboBox" }, textarea: { Textarea: "TextArea" } };
const supplementalLocalEquivalents = { "rating/RatingItem": ["Rating"] };
const results = [];
const fluentComponentsByFamily = new Map();

for (const family of baseline.families) {
  const [defaultPackageName, fluentPath, source] = fluentFiles.find(([packageName]) => packageName === family.package);
  const aliases = source ? buildAliases(source) : new Map();
  const fluentComponentProps = new Map();
  const publicNames = new Map();
  if (source) walk(source, node => {
    if (!ts.isExportDeclaration(node) || !node.exportClause || !ts.isNamedExports(node.exportClause)) return;
    for (const element of node.exportClause.elements) publicNames.set(element.propertyName?.getText(source) ?? element.name.getText(source), element.name.getText(source));
  });
  if (source) walk(source, node => {
    if (!ts.isVariableDeclaration(node) || !node.name || !node.type) return;
    const declaredName = node.name.getText();
    const componentName = publicNames.get(declaredName) ?? declaredName;
    const declarationText = node.type.getText(source);
    if (/\bProvider\s*</.test(declarationText) && /\bFC\s*<\s*ProviderProps\s*</.test(declarationText)) {
      fluentComponentProps.set(componentName, new Map([["value", false]]));
      return;
    }
    const match = node.type.getText().match(/(?:ForwardRefComponent|ForwardRefExoticComponent|FunctionComponent|FC)<([A-Za-z_$][\w$]*)>/);
    if (!match) return;
    const aliasName = match[1];
    const alias = aliases.get(aliasName);
    if (alias) fluentComponentProps.set(componentName, propsFromType(alias, aliases));
  });
  fluentComponentsByFamily.set(family.family, [...fluentComponentProps.keys()]);
  const expected = [...new Set([...(family.componentExamples ?? []), ...fluentComponentProps.keys()])];
  for (const name of expected) {
    const localName = equivalents[family.family]?.[name] ?? name;
    const contractKey = `${family.family}/${name}`;
    const helperReason = nonComponentContracts.get(contractKey);
    if (helperReason) {
      const localUtilityAvailable = localFunctions.has(localName) || localByName.has(localName);
      results.push({ family: family.family, component: name, localComponent: localName, status: localUtilityAvailable ? "non-component-contract" : "missing-local-export", reason: helperReason });
      continue;
    }
    if (!localFunctions.has(localName) && !localByName.has(localName)) {
      results.push({ family: family.family, component: name, localComponent: localName, status: "missing-local-export", reason: "Installed Fluent package exports this component; no matching React adapter or catalog entry was found" });
      continue;
    }
    const local = localFunctions.get(localName);
    const localProps = local ? propsFromType(local, localAliases) : undefined;
    const supplementalLocals = supplementalLocalEquivalents[contractKey] ?? [];
    if (localProps) for (const supplementalName of supplementalLocals) {
      const supplementalType = localFunctions.get(supplementalName);
      if (supplementalType) for (const [prop, optional] of propsFromType(supplementalType, localAliases)) if (!localProps.has(prop)) localProps.set(prop, optional);
    }
    const localComponent = [localName, ...supplementalLocals].join(" + ");
    const sourcePackage = fluentPackageOverridesByComponent.get(contractKey) ?? defaultPackageName;
    const sourceForComponent = fluentFiles.find(([packageName]) => packageName === sourcePackage)?.[2];
    const fluentContract = getFluentOwnProps(sourceForComponent, name);
    if (!fluentContract || !localProps) {
      const missingPackage = !sourceForComponent;
      results.push({ family: family.family, component: name, localComponent, status: missingPackage ? "unavailable-baseline" : "manual-review", referencePackage: sourcePackage, reason: missingPackage ? `The reference package ${sourcePackage} is not installed in this SPFx dependency tree, so its declaration cannot be audited here.` : !fluentContract ? "Fluent component prop type was not resolved from the installed declaration" : "Local prop type is indirect or not a direct exported function" });
      continue;
    }
    const fluentProps = fluentContract.props;
    const fluentAliases = sourceForComponent ? buildFluentAliases(sourceForComponent, fluentFiles) : new Map();
    const fluentSlotProps = componentSlotProps(fluentContract.type, fluentAliases);
    const fluentNames = new Set(fluentProps.keys());
    const localNames = new Set(localProps.keys());
    const missingLocally = [...fluentNames].filter(prop => !localNames.has(prop)).sort();
    const missingSlotProps = [...fluentSlotProps].filter(prop => !localNames.has(prop)).sort();
    const localAdditions = [...localNames].filter(prop => !fluentNames.has(prop)).sort();
    const fluentLiterals = literalPropsFromType(fluentContract.type, fluentAliases);
    const localLiterals = literalPropsFromType(local, localAliases);
    const missingLiteralValues = [];
    for (const [prop, expected] of fluentLiterals) {
      const actual = localLiterals.get(prop);
      if (actual) {
        const missing = expected.filter(value => !actual.includes(value));
        if (missing.length) missingLiteralValues.push({ prop, expected, actual, missing });
      }
    }
    results.push({ family: family.family, component: name, localComponent, status: missingLocally.length ? "review-prop-gaps" : missingSlotProps.length ? "review-slot-prop-gaps" : missingLiteralValues.length ? "review-prop-value-gaps" : "own-prop-names-covered", fluentOwnProps: [...fluentNames].sort(), fluentSlotProps: [...fluentSlotProps].sort(), localOwnProps: [...localNames].sort(), missingLocally, missingSlotProps, localAdditions, missingLiteralValues });
  }
}
const knownSlotContracts = [
  ["input", "Input", ["contentBefore", "contentAfter"]],
  ["input", "SearchBox", ["contentBefore", "contentAfter", "dismiss"]],
  ["checkbox", "Checkbox", ["indicator", "label"]],
];
for (const [family, component, expectedSlots] of knownSlotContracts) {
  const actual = results.find(result => result.family === family && result.component === component)?.fluentSlotProps;
  if (!actual || expectedSlots.some(slot => !actual.includes(slot))) throw new Error(`Fluent slot contract extraction regressed for ${family}/${component}: expected ${expectedSlots.join(", ")}; received ${actual?.join(", ") ?? "no contract"}`);
}
const report = {
  baseline: `${baseline.reference}@${baseline.version}`,
  fluentPackages: fluentFiles.filter(([, , file]) => file).length,
  scope: "Named own props, public slot props declared through Fluent ComponentProps<Slots>, and resolvable string/number/boolean literal-union values versus local exported adapter props; local aliases, union/intersection branches, Pick/Omit key filtering, overloads, and Parameters<typeof Component>[0] are resolved. Value comparison reports only when both sides resolve to literal sets. SearchBox and DataGrid resolve from their actual Fluent subpackages. Non-component utilities are classified separately; absent reference packages are reported as unavailable rather than counted as prop gaps. Inherited React/DOM props and runtime semantics are excluded.",
  summary: {
    comparedComponents: results.filter(result => !["manual-review", "unavailable-baseline", "non-component-contract"].includes(result.status)).length,
    missingLocalComponentExports: results.filter(result => result.status === "missing-local-export").length,
    componentsWithPropNameGaps: results.filter(result => result.status === "review-prop-gaps").length,
    componentsWithSlotPropGaps: results.filter(result => result.missingSlotProps?.length).length,
    componentsWithPropValueGaps: results.filter(result => result.missingLiteralValues?.length).length,
    manualReviewComponents: results.filter(result => result.status === "manual-review").length,
    unavailableBaselineComponents: results.filter(result => result.status === "unavailable-baseline").length,
    nonComponentContracts: results.filter(result => result.status === "non-component-contract").length,
    missingOwnPropCount: results.reduce((sum, result) => sum + (result.missingLocally?.length ?? 0), 0),
    declaredSlotPropCount: results.reduce((sum, result) => sum + (result.fluentSlotProps?.length ?? 0), 0),
    missingSlotPropCount: results.reduce((sum, result) => sum + (result.missingSlotProps?.length ?? 0), 0),
    missingLiteralValueCount: results.reduce((sum, result) => sum + (result.missingLiteralValues?.reduce((count, gap) => count + gap.missing.length, 0) ?? 0), 0),
  },
  components: results,
};
if (process.argv.includes("--sync-inventory")) {
  for (const family of baseline.families) family.componentExamples = [...new Set([...(family.componentExamples ?? []), ...(fluentComponentsByFamily.get(family.family) ?? [])])].sort();
  const path = resolve(root, "investigation/fluent-v9-catalog-9.75.0.json");
  await writeFile(path, `${JSON.stringify(baseline, null, 2)}\n`);
  console.log(`Updated component export inventory in ${path}`);
}
if (process.argv.includes("--write")) {
  const path = resolve(root, "investigation/fluent-v9-own-prop-report.json");
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${path}`);
}
const output = process.argv.includes("--json") ? JSON.stringify(report, null, 2) : [
  `${report.baseline} own-prop and slot contract review`,
  `${report.summary.comparedComponents} compared; ${report.summary.missingLocalComponentExports} missing local component exports; ${report.summary.componentsWithPropNameGaps} have candidate missing prop names; ${report.summary.componentsWithSlotPropGaps} have candidate missing slot props (${report.summary.missingSlotPropCount} missing across ${report.summary.declaredSlotPropCount} declared secondary-slot contracts); ${report.summary.componentsWithPropValueGaps} have candidate literal-value gaps (${report.summary.missingLiteralValueCount} missing values); ${report.summary.manualReviewComponents} need manual type resolution; ${report.summary.unavailableBaselineComponents} reference packages are unavailable; ${report.summary.nonComponentContracts} utility APIs are excluded from component prop comparison.`,
  report.scope,
  ...results.flatMap(result => {
    if (result.status === "manual-review") return [`- ${result.family}/${result.component}: manual review — ${result.reason}`];
    if (result.status === "missing-local-export") return [`- ${result.family}/${result.component}: missing local export`];
    if (result.status === "unavailable-baseline") return [`- ${result.family}/${result.component}: unavailable baseline — ${result.reason}`];
    if (result.status === "non-component-contract") return [`- ${result.family}/${result.component}: utility outside component prop comparison — ${result.reason}`];
    return [
      ...(result.missingLocally?.length ? [`- ${result.family}/${result.component}: missing props — ${result.missingLocally.join(", ")}`] : []),
      ...(result.missingSlotProps?.length ? [`- ${result.family}/${result.component}: missing slot props — ${result.missingSlotProps.join(", ")}`] : []),
      ...(result.missingLiteralValues?.length ? [`- ${result.family}/${result.component}: literal values — ${result.missingLiteralValues.map(gap => `${gap.prop}: missing ${gap.missing.join(" | ")}`).join("; ")}`] : []),
    ];
  }),
].join("\n");
console.log(output);
if (process.argv.includes("--check") && (
  report.summary.missingLocalComponentExports
  || report.summary.missingOwnPropCount
  || report.summary.missingSlotPropCount
  || report.summary.missingLiteralValueCount
  || report.summary.manualReviewComponents
  || report.summary.unavailableBaselineComponents
)) process.exitCode = 1;
