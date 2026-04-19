import { RouteNode } from "../types";

export interface RouteDoc {
  path: string;
  description: string;
  isDynamic: boolean;
  isCatchAll: boolean;
  hasLayout: boolean;
  hasLoading: boolean;
  hasError: boolean;
}

function buildPath(node: RouteNode, parent = ""): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function isDynamic(segment: string): boolean {
  return segment.startsWith("[") && !segment.startsWith("[...");
}

function isCatchAll(segment: string): boolean {
  return segment.startsWith("[...");
}

function walk(node: RouteNode, parentPath = ""): RouteDoc[] {
  const path = node.segment === "" ? "/" : buildPath(node, parentPath);
  const docs: RouteDoc[] = [];

  if (node.isPage) {
    docs.push({
      path,
      description: generateDescription(node),
      isDynamic: isDynamic(node.segment),
      isCatchAll: isCatchAll(node.segment),
      hasLayout: node.hasLayout ?? false,
      hasLoading: node.hasLoading ?? false,
      hasError: node.hasError ?? false,
    });
  }

  for (const child of node.children ?? []) {
    docs.push(...walk(child, path === "/" ? "" : path));
  }

  return docs;
}

function generateDescription(node: RouteNode): string {
  const parts: string[] = [];
  if (isCatchAll(node.segment)) parts.push("Catch-all route");
  else if (isDynamic(node.segment)) parts.push("Dynamic route");
  else parts.push("Static route");
  if (node.hasLayout) parts.push("with layout");
  if (node.hasLoading) parts.push("with loading state");
  if (node.hasError) parts.push("with error boundary");
  return parts.join(", ");
}

export function documentRoutes(root: RouteNode): RouteDoc[] {
  return walk(root);
}

export function formatDocs(docs: RouteDoc[]): string {
  return docs
    .map(
      (d) =>
        `${d.path}\n  ${d.description}\n  dynamic=${d.isDynamic} catchAll=${d.isCatchAll} layout=${d.hasLayout}`
    )
    .join("\n\n");
}
