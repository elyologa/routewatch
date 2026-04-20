import { RouteNode } from "../types";

export function buildPath(node: RouteNode, parent = ""): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

export function collectPaths(
  node: RouteNode,
  parent = "",
  seen = new Set<string>()
): Set<string> {
  const path = buildPath(node, parent);
  seen.add(path);
  for (const child of node.children ?? []) {
    collectPaths(child, path, seen);
  }
  return seen;
}

export interface CircularRef {
  path: string;
  reason: string;
}

export function detectCircular(
  node: RouteNode,
  parent = "",
  ancestors: Set<string> = new Set()
): CircularRef[] {
  const path = buildPath(node, parent);
  const issues: CircularRef[] = [];

  if (ancestors.has(path)) {
    issues.push({ path, reason: `Circular reference detected at "${path}"` });
    return issues;
  }

  const next = new Set(ancestors);
  next.add(path);

  for (const child of node.children ?? []) {
    issues.push(...detectCircular(child, path, next));
  }

  return issues;
}

export function checkCircularRoutes(root: RouteNode): CircularRef[] {
  return detectCircular(root);
}

export function formatCircularReport(refs: CircularRef[]): string {
  if (refs.length === 0) return "No circular references found.";
  const lines = refs.map((r) => `  [CIRCULAR] ${r.reason}`);
  return `Found ${refs.length} circular reference(s):\n${lines.join("\n")}`;
}
