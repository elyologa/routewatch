import * as path from "path";
import * as fs from "fs";
import { RouteNode } from "../scanner/routeScanner";

export interface RouteDependency {
  route: string;
  imports: string[];
  dependsOn: string[];
}

export interface DependencyGraph {
  nodes: RouteDependency[];
  edges: Array<{ from: string; to: string }>;
}

export function buildPath(node: RouteNode, base = ""): string {
  return base ? `${base}/${node.segment}` : `/${node.segment}`;
}

function extractImports(filePath: string): string[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function resolveRouteDeps(imports: string[], allRoutes: string[]): string[] {
  return imports
    .map((imp) => {
      const normalized = imp.replace(/^@\/app/, "").replace(/\/page$/, "");
      return allRoutes.find((r) => r === normalized || r.endsWith(normalized));
    })
    .filter((r): r is string => r !== undefined);
}

export function collectDependencies(
  node: RouteNode,
  appDir: string,
  allRoutes: string[],
  base = ""
): RouteDependency[] {
  const routePath = buildPath(node, base);
  const pageFile = path.join(appDir, routePath, "page.tsx");
  const imports = extractImports(pageFile);
  const dependsOn = resolveRouteDeps(imports, allRoutes);

  const current: RouteDependency = { route: routePath, imports, dependsOn };
  const children = (node.children ?? []).flatMap((child) =>
    collectDependencies(child, appDir, allRoutes, routePath)
  );

  return [current, ...children];
}

export function buildDependencyGraph(
  nodes: RouteDependency[]
): DependencyGraph {
  const edges = nodes.flatMap((n) =>
    n.dependsOn.map((dep) => ({ from: n.route, to: dep }))
  );
  return { nodes, edges };
}

export function formatDependencyGraph(graph: DependencyGraph): string {
  if (graph.nodes.length === 0) return "No route dependencies found.";
  const lines: string[] = ["Route Dependency Graph:", ""];
  for (const node of graph.nodes) {
    if (node.dependsOn.length > 0) {
      lines.push(`  ${node.route}`);
      for (const dep of node.dependsOn) {
        lines.push(`    └─ depends on: ${dep}`);
      }
    }
  }
  if (lines.length === 2) lines.push("  No inter-route dependencies detected.");
  return lines.join("\n");
}
