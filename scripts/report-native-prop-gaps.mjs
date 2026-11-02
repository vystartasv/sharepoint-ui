import { resolve as resolvePath } from "node:path";
import ts from "typescript";

const root = process.cwd();
const localPath = resolvePath(root, "packages/sharepoint-ui/src/react.tsx");
const virtualPath = resolvePath(root, "packages/sharepoint-ui/src/__native_prop_audit__.tsx");
const configPath = resolvePath(root, "packages/sharepoint-ui/tsconfig.json");
const contracts = [
  { component: "Button", localType: "ButtonProps", nativeType: "ButtonHTMLAttributes<HTMLButtonElement>" },
  // These Fluent roots inherit the shared HTML attribute surface; element-specific event types are excluded below.
  { component: "Card", localType: "CardProps", nativeType: "HTMLAttributes<HTMLDivElement>" },
  { component: "Text", localType: "TextProps", nativeType: "HTMLAttributes<HTMLSpanElement>" },
  { component: "Badge", localType: "BadgeProps", nativeType: "HTMLAttributes<HTMLDivElement>", intentionalTypeOverrides: ["color"] },
  { component: "Avatar", localType: "AvatarProps", nativeType: "HTMLAttributes<HTMLSpanElement>", intentionalTypeOverrides: ["color"] },
  { component: "Input", localType: "InputProps", nativeType: "InputHTMLAttributes<HTMLInputElement>", intentionalTypeOverrides: ["size", "children"] },
  { component: "Link", localType: "LinkProps", nativeType: "AnchorHTMLAttributes<HTMLAnchorElement>" },
  { component: "Select", localType: "SelectProps", nativeType: "SelectHTMLAttributes<HTMLSelectElement>", intentionalTypeOverrides: ["size"] },
  { component: "TextArea", localType: "TextAreaProps", nativeType: "TextareaHTMLAttributes<HTMLTextAreaElement>", intentionalTypeOverrides: ["wrap"] },
  { component: "Checkbox", localType: "CheckboxProps", nativeType: "HTMLAttributes<HTMLDivElement>", intentionalTypeOverrides: ["children", "color"] },
  { component: "Switch", localType: "SwitchProps", nativeType: "HTMLAttributes<HTMLDivElement>" },
  { component: "RadioGroup", localType: "RadioGroupProps", nativeType: "HTMLAttributes<HTMLDivElement>", intentionalTypeOverrides: ["defaultValue"] },
  { component: "Slider", localType: "SliderProps", nativeType: "HTMLAttributes<HTMLDivElement>", intentionalTypeOverrides: ["defaultValue"] },
  { component: "SpinButton", localType: "SpinButtonProps", nativeType: "HTMLAttributes<HTMLDivElement>", intentionalTypeOverrides: ["defaultValue"] },
  { component: "ComboBox", localType: "ComboBoxProps", nativeType: "HTMLAttributes<HTMLDivElement>", intentionalTypeOverrides: ["defaultValue"] },
  { component: "Dropdown", localType: "DropdownProps", nativeType: "HTMLAttributes<HTMLDivElement>", intentionalTypeOverrides: ["defaultValue"] },
  { component: "SearchBox", localType: "SearchBoxProps", nativeType: "InputHTMLAttributes<HTMLInputElement>", intentionalTypeOverrides: ["defaultValue", "size", "value"], excludedNativeProps: ["children", "type"] },
  { component: "ColorPicker", localType: "ColorPickerProps", nativeType: "HTMLAttributes<HTMLDivElement>", intentionalTypeOverrides: ["color", "defaultValue"] },
  { component: "Rating", localType: "RatingProps", nativeType: "HTMLAttributes<HTMLDivElement>", intentionalTypeOverrides: ["color", "defaultValue"] },
];
const componentFlag = process.argv.indexOf("--component");
const componentFilter = componentFlag < 0 ? undefined : process.argv[componentFlag + 1];
const selectedContracts = componentFilter ? contracts.filter(contract => contract.component === componentFilter) : contracts;
if (!selectedContracts.length) throw new Error(`Unknown native prop contract: ${componentFilter}`);
const virtualSource = `import * as React from "react";\n${contracts.map(contract => `type ${contract.component}NativeContract = React.${contract.nativeType};`).join("\n")}\n`;
const config = ts.readConfigFile(configPath, ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, resolvePath(root, "packages/sharepoint-ui"));
const host = ts.createCompilerHost({ ...parsed.options, noEmit: true });
const baseGetSourceFile = host.getSourceFile.bind(host);
const baseFileExists = host.fileExists.bind(host);
const baseReadFile = host.readFile.bind(host);
host.fileExists = file => resolvePath(file) === virtualPath || baseFileExists(file);
host.readFile = file => resolvePath(file) === virtualPath ? virtualSource : baseReadFile(file);
host.getSourceFile = (file, languageVersion, onError, shouldCreateNewSourceFile) => resolvePath(file) === virtualPath
  ? ts.createSourceFile(file, virtualSource, languageVersion, true, ts.ScriptKind.TSX)
  : baseGetSourceFile(file, languageVersion, onError, shouldCreateNewSourceFile);
const program = ts.createProgram({ rootNames: [...parsed.fileNames, virtualPath], options: { ...parsed.options, noEmit: true }, host });
const checker = program.getTypeChecker();
const localSource = program.getSourceFile(localPath);
const contractsSource = program.getSourceFile(virtualPath);
if (!localSource || !contractsSource) throw new Error("Could not load native prop audit type sources");
const localAliases = new Map(localSource.statements.filter(ts.isTypeAliasDeclaration).map(alias => [alias.name.text, alias]));
const referenceAliases = new Map(contractsSource.statements.filter(ts.isTypeAliasDeclaration).map(alias => [alias.name.text, alias]));
const ignoreValueTypeNames = name => /^on[A-Z]/.test(name); // Runtime event routing is reported separately from assignable prop values.
const reports = [];
for (const contract of selectedContracts) {
  const localAlias = localAliases.get(contract.localType);
  const referenceAlias = referenceAliases.get(`${contract.component}NativeContract`);
  if (!localAlias || !referenceAlias) throw new Error(`Could not resolve ${contract.component} native/local prop types`);
  const localType = checker.getTypeFromTypeNode(localAlias.type);
  const nativeType = checker.getTypeFromTypeNode(referenceAlias.type);
  const localProperties = new Map(checker.getPropertiesOfType(localType).map(symbol => [symbol.name, symbol]));
  const missing = [];
  const incompatible = [];
  const requiredLocally = [];
  for (const nativeProperty of checker.getPropertiesOfType(nativeType)) {
    if ((contract.excludedNativeProps ?? []).includes(nativeProperty.name)) continue;
    const localProperty = localProperties.get(nativeProperty.name);
    if (!localProperty) {
      missing.push(nativeProperty.name);
      continue;
    }
    if ((contract.intentionalTypeOverrides ?? []).includes(nativeProperty.name) || ignoreValueTypeNames(nativeProperty.name)) continue;
    const nativeOptional = Boolean(nativeProperty.flags & ts.SymbolFlags.Optional);
    const localOptional = Boolean(localProperty.flags & ts.SymbolFlags.Optional);
    if (nativeOptional && !localOptional) requiredLocally.push(nativeProperty.name);
    const nativeValueType = checker.getTypeOfSymbolAtLocation(nativeProperty, nativeProperty.valueDeclaration ?? referenceAlias);
    const localValueType = checker.getTypeOfSymbolAtLocation(localProperty, localProperty.valueDeclaration ?? localAlias);
    if (!checker.isTypeAssignableTo(nativeValueType, localValueType)) {
      incompatible.push({
        prop: nativeProperty.name,
        nativeType: checker.typeToString(nativeValueType, nativeProperty.valueDeclaration, ts.TypeFormatFlags.NoTruncation),
        localType: checker.typeToString(localValueType, localProperty.valueDeclaration, ts.TypeFormatFlags.NoTruncation),
      });
    }
  }
  reports.push({ component: contract.component, missing: missing.sort(), requiredLocally: requiredLocally.sort(), incompatible });
}
const gapCount = reports.reduce((count, report) => count + report.missing.length + report.requiredLocally.length + report.incompatible.length, 0);
const output = {
  baseline: "React native element attribute contracts used by Fluent v9 primary slots",
  scope: "Inherited native prop names, optionality, and native-to-local value assignability for the listed component families. Root element types follow Fluent v9 slot contracts; SearchBox inherits input attributes. React event prop names are included but event type/routing behavior is excluded; intentional component type overrides are listed in the script. This does not establish family-wide Fluent behavior parity.",
  contracts: reports,
  summary: { componentContracts: reports.length, candidateGapCount: gapCount },
};
console.log(JSON.stringify(output, null, 2));
if (process.argv.includes("--check") && gapCount) process.exitCode = 1;
