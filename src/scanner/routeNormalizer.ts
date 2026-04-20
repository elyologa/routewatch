import { RouteNode } from "../types";

export interface NormalizedRoute {
  raw: string;
  normalized: string;
  segments: string[];
  isDynamic: boolean;
  isCatchAll: boolean;
  isOptionalCatchAll: boolean;
  depth: number;
}

export function normalizeSegment(segment: string): string {
  // Strip route group parens: (group) -> ""
  if (/^\(.*\)$/.test(segment)) return "";
  // Optional catch-all: [[...slug]] -> :slug*?
  if (/^\[\[\.\.\.(\w+)\]\]$/.test(segment)) {
    return `:${segment.slice(5, -2)}*?`;
  }
  // Catch-all: [...slug] -> :slug*
  if (/^\[\.\.\.\w+\]$/.test(segment)) {
    return `:${segment.slice(4, -1)}*`;
  }
  // Dynamic: [slug] -> :slug
  if (/^\[\w+\]$/.test(segment)) {
    return `:${segment.slice(1, -1)}`;
  }
  return segment;
}

export function buildPath(node: RouteNode, prefix = ""): string {
  return prefix ? `${prefix}/${node.segment}` : `/${node.segment}`;
}

export function normalizeRoute(raw: string): NormalizedRoute {
  const parts = raw.split("/").filter(Boolean);
  const normalizedParts = parts
    .map(normalizeSegment)
    .filter((s) => s !== "");

  const normalized = "/" + normalizedParts.join("/") || "/";

  return {
    raw,
    normalized,
    segments: normalizedParts,
    isDynamic: parts.some((p) => /^\[\w+\]$/.test(p)),
    isCatchAll: parts.some((p) => /^\[\.\.\.\w+\]$/.test(p)),
    isOptionalCatchAll: parts.some((p) => /^\[\[\.\.\.(\w+)\]\]$/.test(p)),
    depth: normalizedParts.length,
  };
}

export function collectRawPaths(node: RouteNode, prefix = ""): string[] {
  const current = prefix ? `${prefix}/${node.segment}` : node.segment;
  const paths: string[] = [];
  if (node.segment !== "") paths.push(`/${current}`);
  for (const child of node.children ?? []) {
    paths.push(...collectRawPaths(child, current));
  }
  return paths;
}

export function normalizeRoutes(node: RouteNode): NormalizedRoute[] {
  const rawPaths = collectRawPaths(node);
  return rawPaths.map(normalizeRoute);
}

export function formatNormalized(routes: NormalizedRoute[]): string {
  const lines = routes.map((r) => {
    const flags = [
      r.isDynamic ? "dynamic" : "",
      r.isCatchAll ? "catch-all" : "",
      r.isOptionalCatchAll ? "optional" : "",
    ]
      .filter(Boolean)
      .join(", ");
    const tag = flags ? ` [${flags}]` : "";
    return `  ${r.raw.padEnd(40)} -> ${r.normalized}${tag}`;
  });
  return ["Normalized Routes:", ...lines].join("\n");
}
