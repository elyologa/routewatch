import { RouteNode } from '../scanner/routeScanner';

export interface NamespaceGroup {
  namespace: string;
  routes: string[];
  count: number;
}

export interface NamespaceReport {
  groups: NamespaceGroup[];
  ungrouped: string[];
  total: number;
}

export function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === 'root' ? '' : `/${node.segment}`;
  return parent + segment;
}

export function extractNamespace(path: string): string | null {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return null;
  const first = parts[0];
  // Skip dynamic, catch-all, group, and private segments
  if (
    first.startsWith('[') ||
    first.startsWith('(') ||
    first.startsWith('_')
  ) {
    return null;
  }
  return first;
}

export function walk(node: RouteNode, parent = ''): string[] {
  const current = buildPath(node, parent);
  const paths: string[] = [];
  if (node.hasPage || node.hasLayout) {
    paths.push(current || '/');
  }
  for (const child of node.children ?? []) {
    paths.push(...walk(child, current));
  }
  return paths;
}

export function groupByNamespace(node: RouteNode): NamespaceReport {
  const allPaths = walk(node);
  const map = new Map<string, string[]>();
  const ungrouped: string[] = [];

  for (const path of allPaths) {
    const ns = extractNamespace(path);
    if (!ns) {
      ungrouped.push(path);
    } else {
      if (!map.has(ns)) map.set(ns, []);
      map.get(ns)!.push(path);
    }
  }

  const groups: NamespaceGroup[] = Array.from(map.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .map(([namespace, routes]) => ({ namespace, routes, count: routes.length }));

  return { groups, ungrouped, total: allPaths.length };
}

export function formatNamespaceReport(report: NamespaceReport): string {
  const lines: string[] = [];
  lines.push(`Route Namespaces (${report.groups.length} namespaces, ${report.total} total routes)\n`);
  for (const g of report.groups) {
    lines.push(`  ${g.namespace}/ (${g.count} routes)`);
    for (const r of g.routes) {
      lines.push(`    ${r}`);
    }
  }
  if (report.ungrouped.length > 0) {
    lines.push(`\n  (ungrouped) (${report.ungrouped.length} routes)`);
    for (const r of report.ungrouped) {
      lines.push(`    ${r}`);
    }
  }
  return lines.join('\n');
}
