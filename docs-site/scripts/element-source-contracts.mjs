import ts from "typescript";

/** Read literal observedAttributes arrays and associate them with customElements.define tags. */
export function elementAttributesFor(source, fileName = "element.ts") {
  const root = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const classAttributes = new Map();
  const tagAttributes = {};
  const readName = node => node && (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : undefined;
  const observedAttributes = node => {
    const property = node.members?.find(member => ts.isPropertyDeclaration(member) && readName(member.name) === "observedAttributes" && ts.getModifiers(member)?.some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword));
    return property && ts.isArrayLiteralExpression(property.initializer)
      ? property.initializer.elements.map(readName).filter(Boolean)
      : [];
  };
  const readClasses = node => {
    if ((ts.isClassDeclaration(node) || ts.isClassExpression(node)) && node.name) classAttributes.set(node.name.text, observedAttributes(node));
    ts.forEachChild(node, readClasses);
  };
  readClasses(root);
  const readDefinitions = node => {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "define") {
      const receiver = node.expression.expression;
      const isCustomElements = (ts.isIdentifier(receiver) && receiver.text === "customElements") || (ts.isPropertyAccessExpression(receiver) && receiver.name.text === "customElements");
      const tag = readName(node.arguments[0]);
      const definition = node.arguments[1];
      const className = definition && ts.isIdentifier(definition) ? definition.text : undefined;
      const attributes = definition && (ts.isClassDeclaration(definition) || ts.isClassExpression(definition))
        ? observedAttributes(definition)
        : className ? classAttributes.get(className) ?? [] : [];
      if (isCustomElements && tag && attributes.length) tagAttributes[tag] = [...new Set(attributes)].sort();
    }
    ts.forEachChild(node, readDefinitions);
  };
  readDefinitions(root);
  return tagAttributes;
}
