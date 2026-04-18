import { RouteNode } from "../visualizer";

export interface RouteGroup {
  prefix: string;
  routes: RouteNode[];
}

/**
 * Groups route nodes by their top-level path segment.
 */
export function groupBySegment(routes: RouteNode[]): Map<string, RouteNode[]> {
  const map = new Map<string, RouteNode[]>();
  for (const route of routes) {
    const parts = route.path.replace(/^\//, "").split("/");
    const key = parts[0] || "/";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(route);
  }
  return map;
}

/**
 * Groups route nodes by a custom prefix list.
 */
export function groupByPrefixes(
  routes: RouteNode[],
  prefixes: string[]
): RouteGroup[] {
  const groups: RouteGroup[] = prefixes.map((prefix) => ({
    prefix,
    routes: [],
  }));
  const ungrouped: RouteGroup = { prefix: "*", routes: [] };

  for (const route of routes) {
    const matched = groups.find((g) =>
      route.path.startsWith(g.prefix.startsWith("/") ? g.prefix : "/" + g.prefix)
    );
    if (matched) {
      matched.routes.push(route);
    } else {
      ungrouped.routes.push(route);
    }
  }

  if (ungrouped.routes.length > 0) groups.push(ungrouped);
  return groups;
}

/**
 * Flattens a RouteNode tree into a list of leaf nodes with full paths.
 */
export function flattenRoutes(
  node: RouteNode,
  basePath = ""
): RouteNode[] {
  const current = basePath + "/" + node.segment;
  const normalized = current.replace(/\/+/g, "/");
  const result: RouteNode[] = [];
  if (node.isPage) result.push({ ...node, path: normalized });
  for (const child of node.children ?? []) {
    result.push(...flattenRoutes(child, normalized));
  }
  return result;
}
