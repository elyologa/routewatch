import * as path from 'path';
import { RouteNode } from '../scanner/routeScanner';

export interface TraceEntry {
  route: string;
  depth: number;
  parent: string | null;
  children: string[];
  isLeaf: boolean;
  isDynamic: boolean;
  isCatchAll: boolean;
}

export interface TraceReport {
  entries: TraceEntry[];
  totalRoutes: number;
  maxDepth: number;
  leafCount: number;
}

function buildPath(node: RouteNode, parent: string): string {
  return parent === '/' ? `/${node.segment}` : `${parent}/${node.segment}`;
}

function isDynamic(segment: string): boolean {
  return segment.startsWith('[') && !segment.startsWith('[...');
}

function isCatchAll(segment: string): boolean {
  return segment.startsWith('[...');
}

function walk(
  node: RouteNode,
  parentPath: string,
  depth: number,
  entries: TraceEntry[]
): void {
  const routePath = node.segment === '' ? '/' : buildPath(node, parentPath);
  const childPaths = node.children.map(c =>
    routePath === '/' ? `/${c.segment}` : `${routePath}/${c.segment}`
  );

  entries.push({
    route: routePath,
    depth,
    parent: depth === 0 ? null : parentPath,
    children: childPaths,
    isLeaf: node.children.length === 0,
    isDynamic: isDynamic(node.segment),
    isCatchAll: isCatchAll(node.segment),
  });

  for (const child of node.children) {
    walk(child, routePath, depth + 1, entries);
  }
}

export function traceRoutes(root: RouteNode): TraceReport {
  const entries: TraceEntry[] = [];
  walk(root, '', 0, entries);

  const maxDepth = entries.reduce((m, e) => Math.max(m, e.depth), 0);
  const leafCount = entries.filter(e => e.isLeaf).length;

  return {
    entries,
    totalRoutes: entries.length,
    maxDepth,
    leafCount,
  };
}

export function formatTraceReport(report: TraceReport): string {
  const lines: string[] = [
    `Route Trace Report`,
    `==================`,
    `Total routes : ${report.totalRoutes}`,
    `Max depth    : ${report.maxDepth}`,
    `Leaf routes  : ${report.leafCount}`,
    '',
  ];

  for (const entry of report.entries) {
    const indent = '  '.repeat(entry.depth);
    const flags: string[] = [];
    if (entry.isDynamic) flags.push('dynamic');
    if (entry.isCatchAll) flags.push('catch-all');
    if (entry.isLeaf) flags.push('leaf');
    const suffix = flags.length ? ` [${flags.join(', ')}]` : '';
    lines.push(`${indent}${entry.route}${suffix}`);
  }

  return lines.join('\n');
}
