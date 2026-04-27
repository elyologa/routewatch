import * as path from 'path';
import { RouteNode } from '../scanner/routeScanner';

export interface RouteLineageEntry {
  route: string;
  depth: number;
  parent: string | null;
  ancestors: string[];
  children: string[];
}

export interface LineageReport {
  entries: RouteLineageEntry[];
  roots: string[];
  leaves: string[];
  maxDepth: number;
}

export function buildPath(node: RouteNode, prefix = ''): string {
  const segment = node.segment === '' ? '' : `/${node.segment}`;
  return `${prefix}${segment}` || '/';
}

export function walk(
  node: RouteNode,
  parent: string | null,
  ancestors: string[],
  entries: RouteLineageEntry[]
): void {
  const route = buildPath(node, ancestors[ancestors.length - 1] ?? '');
  const children = (node.children ?? []).map((c) =>
    buildPath(c, route === '/' ? '' : route)
  );

  entries.push({
    route,
    depth: ancestors.length,
    parent,
    ancestors: [...ancestors],
    children,
  });

  for (const child of node.children ?? []) {
    walk(child, route, [...ancestors, route], entries);
  }
}

export function collectLineage(root: RouteNode): LineageReport {
  const entries: RouteLineageEntry[] = [];
  walk(root, null, [], entries);

  const roots = entries.filter((e) => e.parent === null).map((e) => e.route);
  const leaves = entries.filter((e) => e.children.length === 0).map((e) => e.route);
  const maxDepth = entries.reduce((m, e) => Math.max(m, e.depth), 0);

  return { entries, roots, leaves, maxDepth };
}

export function formatLineageReport(report: LineageReport): string {
  const lines: string[] = [];
  lines.push(`Route Lineage Report`);
  lines.push(`${'─'.repeat(40)}`);
  lines.push(`Total routes : ${report.entries.length}`);
  lines.push(`Root routes  : ${report.roots.join(', ') || '(none)'}`);
  lines.push(`Leaf routes  : ${report.leaves.length}`);
  lines.push(`Max depth    : ${report.maxDepth}`);
  lines.push('');
  for (const entry of report.entries) {
    const indent = '  '.repeat(entry.depth);
    const parentLabel = entry.parent ? ` (parent: ${entry.parent})` : '';
    lines.push(`${indent}${entry.route}${parentLabel}`);
  }
  return lines.join('\n');
}
