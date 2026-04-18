import { RouteNode } from "../visualizer";

export interface RouteAlias {
  path: string;
  alias: string;
}

export interface AliasMap {
  [path: string]: string;
}

export function buildPath(node: RouteNode, prefix = ""): string {
  return prefix ? `${prefix}/${node.segment}` : node.segment || "/";
}

export function collectPaths(node: RouteNode, current = ""): string[] {
  const path = node.segment ? `${current}/${node.segment}` : current || "/";
  const paths: string[] = [path];
  for (const child of node.children ?? []) {
    paths.push(...collectPaths(child, path));
  }
  return paths;
}

export function applyAliases(paths: string[], aliases: AliasMap): RouteAlias[] {
  return paths.map((path) => ({
    path,
    alias: aliases[path] ?? path,
  }));
}

export function resolveAlias(alias: string, aliases: AliasMap): string | null {
  for (const [path, a] of Object.entries(aliases)) {
    if (a === alias) return path;
  }
  return null;
}

export function formatAliases(aliases: RouteAlias[]): string {
  const lines = aliases
    .filter((a) => a.alias !== a.path)
    .map((a) => `  ${a.alias}  →  ${a.path}`);
  if (lines.length === 0) return "No aliases defined.";
  return ["Route Aliases:", ...lines].join("\n");
}
