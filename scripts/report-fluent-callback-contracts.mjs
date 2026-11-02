import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const fluentRoot = resolve(root, "examples/spfx124-webpart/node_modules");
const resolveFluentDependency = createRequire(resolve(fluentRoot, "@fluentui/react-components/package.json"));
const packageOverrides = {
  "input/SearchBox": "@fluentui/react-search",
  "list/DataGrid": "@fluentui/react-table",
  "table/ColumnIdContextProvider": "@fluentui/react-table",
  "table/createTableColumn": "@fluentui/react-table",
  "toast/useToastController": "@fluentui/react-toast",
};
const [baseline, propReport] = await Promise.all([
  readFile(resolve(root, "investigation/fluent-v9-catalog-9.75.0.json"), "utf8").then(JSON.parse),
  readFile(resolve(root, "investigation/fluent-v9-own-prop-report.json"), "utf8").then(JSON.parse),
]);

const packages = new Map();
for (const family of baseline.families) packages.set(family.package, undefined);
for (const packageName of Object.values(packageOverrides)) packages.set(packageName, undefined);
for (const packageName of packages.keys()) {
  let packageDir;
  try { packageDir = resolve(resolveFluentDependency.resolve(`${packageName}/package.json`), ".."); }
  catch { packageDir = resolve(fluentRoot, packageName); }
  packages.set(packageName, resolve(packageDir, "dist/index.d.ts"));
}

const localFile = resolve(root, "packages/sharepoint-ui/src/react.tsx");
const referenceFiles = [...packages.values()];
const program = ts.createProgram([...new Set([localFile, ...referenceFiles])], {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  jsx: ts.JsxEmit.ReactJSX,
  skipLibCheck: true,
  allowSyntheticDefaultImports: true,
  baseUrl: root,
  paths: {
    "react": [resolve(fluentRoot, "react")],
    "react/*": [resolve(fluentRoot, "react/*")],
    "@fluentui/*": [resolve(fluentRoot, "@fluentui/*")],
    "*": [resolve(fluentRoot, "*")],
  },
  typeRoots: [resolve(fluentRoot, "@types")],
});
const checker = program.getTypeChecker();

function exportedSymbol(file, name) {
  const source = program.getSourceFile(file);
  const module = source && checker.getSymbolAtLocation(source);
  return module && checker.getExportsOfModule(module).find(symbol => symbol.name === name);
}

function componentProps(component, file) {
  const symbol = exportedSymbol(file, component);
  if (!symbol) return undefined;
  const location = symbol.valueDeclaration ?? symbol.declarations?.[0] ?? program.getSourceFile(file);
  const signature = checker.getTypeOfSymbolAtLocation(symbol, location).getCallSignatures()[0];
  const props = signature?.getParameters()[0];
  return props ? checker.getTypeOfSymbolAtLocation(props, props.valueDeclaration ?? location) : undefined;
}

function dataFields(type, seen = new Set()) {
  if (!type || seen.has(type)) return new Set();
  seen.add(type);
  if (type.flags & (ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.BigIntLike | ts.TypeFlags.ESSymbolLike | ts.TypeFlags.Void | ts.TypeFlags.Any | ts.TypeFlags.Unknown)) return new Set();
  if (checker.getIndexTypeOfType(type, ts.IndexKind.Number)) return new Set();
  if (type.isUnion()) return new Set(type.types.flatMap(part => [...dataFields(part, seen)]));
  return new Set(checker.getPropertiesOfType(type).map(property => property.name));
}

function callbackDataFields(propsType, propertyName) {
  const property = propsType && checker.getPropertyOfType(propsType, propertyName);
  if (!property) return undefined;
  const location = property.valueDeclaration ?? property.declarations?.[0] ?? propsType.symbol?.declarations?.[0];
  const valueType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, location));
  const signatures = checker.getSignaturesOfType(valueType, ts.SignatureKind.Call).filter(signature => signature.getParameters().length > 1);
  if (!signatures.length) return undefined;
  return { signatures, fields: new Set(signatures.flatMap(signature => {
    const dataParameter = signature.getParameters()[1];
    const dataType = checker.getTypeOfSymbolAtLocation(dataParameter, dataParameter.valueDeclaration ?? location);
    return [...dataFields(dataType)];
  })) };
}

function callbackArities(propsType, propertyName) {
  const property = propsType && checker.getPropertyOfType(propsType, propertyName);
  if (!property) return [];
  const location = property.valueDeclaration ?? property.declarations?.[0] ?? propsType.symbol?.declarations?.[0];
  const valueType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, location));
  return checker.getSignaturesOfType(valueType, ts.SignatureKind.Call).map(signature => signature.getParameters().length).sort((a, b) => a - b);
}

function callbackEvent(propsType, propertyName) {
  const property = propsType && checker.getPropertyOfType(propsType, propertyName);
  if (!property) return undefined;
  const location = property.valueDeclaration ?? property.declarations?.[0] ?? propsType.symbol?.declarations?.[0];
  const valueType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, location));
  const signatures = checker.getSignaturesOfType(valueType, ts.SignatureKind.Call).filter(signature => signature.getParameters().length > 0);
  if (signatures.length !== 1) return undefined;
  const eventParameter = signatures[0].getParameters()[0];
  return checker.getTypeOfSymbolAtLocation(eventParameter, eventParameter.valueDeclaration ?? location);
}

function callbackDataEvent(propsType, propertyName) {
  const property = propsType && checker.getPropertyOfType(propsType, propertyName);
  if (!property) return undefined;
  const location = property.valueDeclaration ?? property.declarations?.[0] ?? propsType.symbol?.declarations?.[0];
  const valueType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, location));
  const signatures = checker.getSignaturesOfType(valueType, ts.SignatureKind.Call).filter(signature => signature.getParameters().length > 1);
  const eventTypes = signatures.flatMap(signature => {
    const dataParameter = signature.getParameters()[1];
    const dataType = checker.getTypeOfSymbolAtLocation(dataParameter, dataParameter.valueDeclaration ?? location);
    const branches = dataType.isUnion() ? dataType.types : [dataType];
    return branches.flatMap(branch => {
      const eventProperty = checker.getPropertyOfType(branch, "event");
      return eventProperty ? [checker.getTypeOfSymbolAtLocation(eventProperty, eventProperty.valueDeclaration ?? location)] : [];
    });
  });
  return eventTypes.length ? checker.getUnionType(eventTypes, ts.UnionReduction.Subtype) : undefined;
}

function callbackDataEventBranches(propsType, propertyName) {
  const property = propsType && checker.getPropertyOfType(propsType, propertyName);
  if (!property) return new Map();
  const location = property.valueDeclaration ?? property.declarations?.[0] ?? propsType.symbol?.declarations?.[0];
  const valueType = checker.getNonNullableType(checker.getTypeOfSymbolAtLocation(property, location));
  const signatures = checker.getSignaturesOfType(valueType, ts.SignatureKind.Call).filter(signature => signature.getParameters().length > 1);
  const branches = new Map();
  for (const signature of signatures) {
    const dataParameter = signature.getParameters()[1];
    const dataType = checker.getTypeOfSymbolAtLocation(dataParameter, dataParameter.valueDeclaration ?? location);
    for (const dataBranch of (dataType.isUnion() ? dataType.types : [dataType])) {
      const eventProperty = checker.getPropertyOfType(dataBranch, "event");
      if (!eventProperty) continue;
      const eventType = checker.getTypeOfSymbolAtLocation(eventProperty, eventProperty.valueDeclaration ?? location);
      const typeProperty = checker.getPropertyOfType(dataBranch, "type");
      const typeValue = typeProperty ? checker.getTypeOfSymbolAtLocation(typeProperty, typeProperty.valueDeclaration ?? location) : undefined;
      const tags = typeValue
        ? (typeValue.isUnion() ? typeValue.types : [typeValue]).map(type => type.flags & ts.TypeFlags.Undefined ? "undefined" : checker.typeToString(type, location, ts.TypeFormatFlags.NoTruncation))
        : ["<no-type-discriminant>"];
      for (const tag of tags) branches.set(tag, [...(branches.get(tag) ?? []), eventType]);
    }
  }
  return new Map([...branches].map(([tag, types]) => [tag, checker.getUnionType(types, ts.UnionReduction.Subtype)]));
}

const familyPackages = new Map(baseline.families.map(family => [family.family, family.package]));
const results = [];
const inheritedHandlerCollisions = [];
const eventTypeMismatches = [];
const payloadEventTypeMismatches = [];
const payloadEventBranchMismatches = [];
const payloadEventBranchExtensions = [];
let callbackPropsInspected = 0;
let callbacksWithObjectPayload = 0;
let callbacksWithoutObjectPayload = 0;
for (const component of propReport.components) {
  if (!component.fluentOwnProps || component.status === "missing-local-export" || component.status === "unavailable-baseline" || component.status === "manual-review" || component.status === "non-component-contract") continue;
  const packageName = packageOverrides[`${component.family}/${component.component}`] ?? familyPackages.get(component.family);
  const referenceFile = packages.get(packageName);
  if (!referenceFile) continue;
  const fluentProps = componentProps(component.component, referenceFile);
  const localProps = componentProps(component.localComponent, localFile);
  if (!fluentProps || !localProps) continue;
  for (const callback of component.fluentOwnProps.filter(name => /^on[A-Z]/.test(name))) {
    callbackPropsInspected++;
    const expectedArities = callbackArities(fluentProps, callback);
    const localArities = callbackArities(localProps, callback);
    if (expectedArities.some(arity => arity > 1) && localArities.some(arity => arity === 1) && localArities.some(arity => arity > 1)) {
      inheritedHandlerCollisions.push({ component: component.localComponent, callback, expectedArities, localArities });
    }
    const expectedEvent = callbackEvent(fluentProps, callback);
    const localEvent = callbackEvent(localProps, callback);
    if (expectedEvent && localEvent) {
      const fluentAssignableToLocal = checker.isTypeAssignableTo(expectedEvent, localEvent);
      const localAssignableToFluent = checker.isTypeAssignableTo(localEvent, expectedEvent);
      if (!localAssignableToFluent) {
        const location = checker.getPropertyOfType(localProps, callback)?.valueDeclaration ?? localProps.symbol?.declarations?.[0];
        eventTypeMismatches.push({
          component: component.localComponent,
          callback,
          fluentEventType: checker.typeToString(expectedEvent, location, ts.TypeFormatFlags.NoTruncation),
          localEventType: checker.typeToString(localEvent, location, ts.TypeFormatFlags.NoTruncation),
          fluentAssignableToLocal,
          localAssignableToFluent,
        });
      }
    }
    const expectedPayloadEvent = callbackDataEvent(fluentProps, callback);
    const localPayloadEvent = callbackDataEvent(localProps, callback);
    if (expectedPayloadEvent && localPayloadEvent) {
      const fluentAssignableToLocal = checker.isTypeAssignableTo(expectedPayloadEvent, localPayloadEvent);
      const localAssignableToFluent = checker.isTypeAssignableTo(localPayloadEvent, expectedPayloadEvent);
      if (!fluentAssignableToLocal || !localAssignableToFluent) {
        const location = checker.getPropertyOfType(localProps, callback)?.valueDeclaration ?? localProps.symbol?.declarations?.[0];
        payloadEventTypeMismatches.push({
          component: component.localComponent,
          callback,
          fluentDataEventType: checker.typeToString(expectedPayloadEvent, location, ts.TypeFormatFlags.NoTruncation),
          localDataEventType: checker.typeToString(localPayloadEvent, location, ts.TypeFormatFlags.NoTruncation),
          fluentAssignableToLocal,
          localAssignableToFluent,
        });
      }
    }
    const expectedEventBranches = callbackDataEventBranches(fluentProps, callback);
    const localEventBranches = callbackDataEventBranches(localProps, callback);
    const branchTags = new Set([...expectedEventBranches.keys(), ...localEventBranches.keys()]);
    for (const tag of branchTags) {
      const fluentBranch = expectedEventBranches.get(tag);
      const localBranch = localEventBranches.get(tag);
      const fluentAssignableToLocal = fluentBranch && localBranch && checker.isTypeAssignableTo(fluentBranch, localBranch);
      const localAssignableToFluent = fluentBranch && localBranch && checker.isTypeAssignableTo(localBranch, fluentBranch);
      if (!fluentBranch && localBranch) {
        const location = checker.getPropertyOfType(localProps, callback)?.valueDeclaration ?? localProps.symbol?.declarations?.[0];
        payloadEventBranchExtensions.push({ component: component.localComponent, callback, typeBranch: tag, localDataEventType: checker.typeToString(localBranch, location, ts.TypeFormatFlags.NoTruncation) });
      } else if (!localBranch || !fluentAssignableToLocal || !localAssignableToFluent) {
        const location = checker.getPropertyOfType(localProps, callback)?.valueDeclaration ?? localProps.symbol?.declarations?.[0];
        payloadEventBranchMismatches.push({
          component: component.localComponent,
          callback,
          typeBranch: tag,
          fluentDataEventType: fluentBranch ? checker.typeToString(fluentBranch, location, ts.TypeFormatFlags.NoTruncation) : "<missing>",
          localDataEventType: localBranch ? checker.typeToString(localBranch, location, ts.TypeFormatFlags.NoTruncation) : "<missing>",
          fluentAssignableToLocal: Boolean(fluentAssignableToLocal),
          localAssignableToFluent: Boolean(localAssignableToFluent),
        });
      }
    }
    const expected = callbackDataFields(fluentProps, callback);
    if (!expected?.fields.size) {
      callbacksWithoutObjectPayload++;
      continue;
    }
    callbacksWithObjectPayload++;
    const actual = callbackDataFields(localProps, callback);
    const expectedFields = expected.fields;
    const actualFields = actual?.fields ?? new Set();
    const missingFields = [...expectedFields].filter(field => !actualFields.has(field)).sort();
    if (missingFields.length) results.push({ family: component.family, component: component.component, localComponent: component.localComponent, callback, expectedCallbackSignatures: expected.signatures.map(signature => checker.signatureToString(signature)), localCallbackSignatures: actual?.signatures.map(signature => checker.signatureToString(signature)) ?? [], expectedDataFields: [...expectedFields].sort(), localDataFields: [...actualFields].sort(), missingFields, classification: !actual?.signatures.length ? "local-callback-has-no-second-data-parameter" : actualFields.size === 0 ? "local-second-parameter-is-not-an-object-payload" : "local-payload-is-missing-fields" });
  }
}

const deduplicated = new Map();
for (const candidate of results) {
  const key = `${candidate.localComponent}/${candidate.callback}`;
  const existing = deduplicated.get(key);
  if (existing) existing.families = [...new Set([...(existing.families ?? [existing.family]), candidate.family])];
  else deduplicated.set(key, candidate);
}
const candidates = [...deduplicated.values()];

const report = {
  baseline: `${baseline.reference}@${baseline.version}`,
  scope: "Candidate comparison of callback second-parameter property names, first-parameter event assignability, nested data.event type assignability, and inherited-handler collisions against Fluent 9.75.0 declarations. Event candidates are reported when callback or payload event types are not mutually assignable. This does not prove event identity, runtime semantics, or assistive-technology behavior. Union payload branches are combined. Review candidates against exact declarations before changing public API.",
  summary: { callbackPropsInspected, callbacksWithObjectPayload, callbacksWithoutObjectPayload, callbackDataGaps: candidates.length, missingDataFields: candidates.reduce((sum, result) => sum + result.missingFields.length, 0), callbackPayloadShapeGaps: candidates.filter(candidate => candidate.classification !== "local-payload-is-missing-fields").length, inheritedHandlerCollisions: inheritedHandlerCollisions.length, eventTypeMismatches: eventTypeMismatches.length, payloadEventTypeMismatches: payloadEventTypeMismatches.length, payloadEventBranchMismatches: payloadEventBranchMismatches.length, payloadEventBranchExtensions: payloadEventBranchExtensions.length },
  inheritedHandlerCollisions,
  eventTypeMismatches,
  payloadEventTypeMismatches,
  payloadEventBranchMismatches,
  payloadEventBranchExtensions,
  candidates,
};
if (process.argv.includes("--write")) {
  const path = resolve(root, "investigation/fluent-v9-callback-contract-report.json");
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Wrote ${path}`);
}
if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
else console.log([
  `${report.baseline} callback payload field audit`,
  `${report.summary.callbackPropsInspected} Fluent-owned callback props inspected; ${report.summary.callbacksWithObjectPayload} had comparable object payloads and ${report.summary.callbacksWithoutObjectPayload} had no object payload to compare.`,
  `${report.summary.callbackDataGaps} candidate gaps across ${report.summary.missingDataFields} fields; ${report.summary.callbackPayloadShapeGaps} use a different callback payload shape.`,
  `${report.summary.inheritedHandlerCollisions} multi-argument callbacks also expose a conflicting one-argument inherited handler.`,
  `${report.summary.eventTypeMismatches} callbacks use a different event type from Fluent.`,
  report.scope,
  ...candidates.map(candidate => `- ${candidate.localComponent}.${candidate.callback}: missing ${candidate.missingFields.join(", ")} (${candidate.classification})`),
  ...inheritedHandlerCollisions.map(candidate => `- ${candidate.component}.${candidate.callback}: Fluent arities ${candidate.expectedArities.join(",")}; local arities ${candidate.localArities.join(",")}`),
  ...eventTypeMismatches.map(candidate => `- ${candidate.component}.${candidate.callback}: Fluent ${candidate.fluentEventType}; local ${candidate.localEventType} (Fluent→local ${candidate.fluentAssignableToLocal}, local→Fluent ${candidate.localAssignableToFluent})`),
  ...payloadEventTypeMismatches.map(candidate => `- ${candidate.component}.${candidate.callback} data.event: Fluent ${candidate.fluentDataEventType}; local ${candidate.localDataEventType} (Fluent→local ${candidate.fluentAssignableToLocal}, local→Fluent ${candidate.localAssignableToFluent})`),
  ...payloadEventBranchMismatches.map(candidate => `- ${candidate.component}.${candidate.callback} data.event when type=${candidate.typeBranch}: Fluent ${candidate.fluentDataEventType}; local ${candidate.localDataEventType} (Fluent→local ${candidate.fluentAssignableToLocal}, local→Fluent ${candidate.localAssignableToFluent})`),
  ...payloadEventBranchExtensions.map(candidate => `- ${candidate.component}.${candidate.callback} adds local type=${candidate.typeBranch} with data.event ${candidate.localDataEventType}`),
].join("\n"));
if (process.argv.includes("--check") && (
  report.summary.callbackDataGaps
  || report.summary.missingDataFields
  || report.summary.callbackPayloadShapeGaps
  || report.summary.inheritedHandlerCollisions
  || report.summary.eventTypeMismatches
  || report.summary.payloadEventTypeMismatches
)) process.exitCode = 1;
