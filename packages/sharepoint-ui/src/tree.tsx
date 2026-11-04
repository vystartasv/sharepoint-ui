import { createElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

export type TreeNode = { id: string; label: ReactNode; href?: string; children?: readonly TreeNode[]; defaultOpen?: boolean };
export type TreeProps = Omit<HTMLAttributes<HTMLUListElement>, "children" | "aria-label"> & {
  label: string;
  items: readonly TreeNode[];
};

function renderNodes(nodes: readonly TreeNode[]): ReactNode[] {
  return nodes.map(node => createElement("li", { key: node.id },
    node.children?.length
      ? createElement("details", { open: node.defaultOpen },
          createElement("summary", null, node.href ? createElement("a", { href: node.href }, node.label) : node.label),
          createElement("ul", null, renderNodes(node.children)),
        )
      : node.href ? createElement("a", { href: node.href }, node.label) : node.label,
  ));
}

export function Tree({ label, items, className = "", ...props }: TreeProps): ReactElement {
  return createElement("ul", { ...props, "aria-label": label, className: `spui-tree ${className}`.trim() }, renderNodes(items));
}
