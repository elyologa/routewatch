import { RouteNode } from '../scanner/routeScanner';

export interface ConflictPair {
  pathA: string;
  pathB: string;
  reason: string;
}

export interface ConflictReport {
  conflicts: ConflictPair[];
  total: number;
}

function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === 'page' ? '' : `/${node.segment}`;
  return `${parent}${segment}`;
}

function normalize(segment: string): string {
  // Strip brackets to compare dynamic segments structurally
  return segment.replace(/\[\.\.\..+?\]/, '[...catchAll]').replace(/\[.+?\]/, '[param]');
}

function collectPaths(node: RouteNode, parent = ''): Map<string, string> {
  const map = new Map<string, string>();
  const current = buildPath(node, parent);
  if (node.isRoute) {
    map.set(normalize(current), current);
  }
  for (const child of node.children ?? []) {
    for (const [k, v] of collectPaths(child, current)) {
      map.set(k, v);
    }
  }
  return map;
}

function detectConflicts(paths: Map<string, string>): ConflictPair[] {
  const entries = Array.from(paths.entries());
  const conflicts: ConflictPair[] = [];
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [normA, rawA] = entries[i];
      const [normB, rawB] = entries[j];
      if (normA === normB && rawA !== rawB) {
        conflicts.push({ pathA: rawA, pathB: rawB, reason: 'Ambiguous dynamic segments resolve to the same pattern' });
      }
    }
  }
  return conflicts;
}

export function checkRouteConflicts(root: RouteNode): ConflictReport {
  const paths = collectPaths(root);
  const conflicts = detectConflicts(paths);
  return { conflicts, total: conflicts.length };
}

export function formatConflictReport(report: ConflictReport): string {
  if (report.total === 0) return '\x1b[32m✔ No route conflicts detected.\x1b[0m\n';
  const lines: string[] = [`\x1b[31m✖ ${report.total} conflict(s) detected:\x1b[0m\n`];
  for (const c of report.conflicts) {
    lines.push(`  \x1b[33m${c.pathA}\x1b[0m  ↔  \x1b[33m${c.pathB}\x1b[0m`);
    lines.push(`    Reason: ${c.reason}\n`);
  }
  return lines.join('\n');
}
