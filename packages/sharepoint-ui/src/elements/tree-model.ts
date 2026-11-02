export type TreeNode<T = unknown> = {
  id: string | number;
  label: string;
  disabled?: boolean;
  open?: boolean;
  children?: readonly TreeNode<T>[];
  value?: T;
};

export type VisibleTreeNode<T = unknown> = {
  node: TreeNode<T>;
  key: string;
  parentKey?: string;
  level: number;
  position: number;
  setSize: number;
};

export function treeNodeKey<T>(node: TreeNode<T>): string { return String(node.id); }

export function flattenTree<T>(nodes: readonly TreeNode<T>[], expandedKeys: ReadonlySet<string>): VisibleTreeNode<T>[] {
  const result: VisibleTreeNode<T>[] = [];
  const seenIds = new Set<string>();
  const stack: Array<{ node: TreeNode<T>; parentKey?: string; level: number; position: number; setSize: number }> = [];
  for (let index = nodes.length - 1; index >= 0; index--) stack.push({ node: nodes[index], level: 1, position: index + 1, setSize: nodes.length });
  while (stack.length) {
    const entry = stack.pop()!;
    const key = treeNodeKey(entry.node);
    if (seenIds.has(key)) continue;
    seenIds.add(key);
    result.push({ ...entry, key });
    const children = entry.node.children ?? [];
    if (children.length && expandedKeys.has(key)) {
      for (let index = children.length - 1; index >= 0; index--) stack.push({ node: children[index], parentKey: key, level: entry.level + 1, position: index + 1, setSize: children.length });
    }
  }
  return result;
}

export function flattenAllTree<T>(nodes: readonly TreeNode<T>[]): VisibleTreeNode<T>[] {
  const expanded = new Set<string>(), stack = [...nodes];
  while (stack.length) {
    const node = stack.pop()!, key = treeNodeKey(node);
    if (expanded.has(key)) continue;
    expanded.add(key);
    if (node.children) stack.push(...node.children);
  }
  return flattenTree(nodes, expanded);
}
