import * as fs from 'fs';
import * as path from 'path';
import type { RouteNode } from '../scanner/routeScanner';

export interface RouteFrequencyEntry {
  path: string;
  referenceCount: number;
  referencedBy: string[];
}

export interface FrequencyReport {
  entries: RouteFrequencyEntry[];
  totalRoutes: number;
  unreferenced: number;
  mostReferenced: RouteFrequencyEntry | null;
}

export function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === 'root' ? '' : `/${node.segment}`;
  return parent + segment;
}

export function collectPaths(node: RouteNode, parent = ''): string[] {
  const current = buildPath(node, parent);
  const paths: string[] = current ? [current] : [];
  for (const child of node.children ?? []) {
    paths.push(...collectPaths(child, current));
  }
  return paths;
}

export function scanForReferences(dir: string, routes: string[]): Map<string, string[]> {
  const refs = new Map<string, string[]>(routes.map(r => [r, []]));

  function walk(current: string): void {
    if (!fs.existsSync(current)) return;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
        const content = fs.readFileSync(full, 'utf8');
        for (const route of routes) {
          if (content.includes(`"${route}"`) || content.includes(`'${route}'`) || content.includes(`\`${route}\``)) {
            refs.get(route)!.push(full);
          }
        }
      }
    }
  }

  walk(dir);
  return refs;
}

export function analyzeFrequency(node: RouteNode, srcDir: string): FrequencyReport {
  const routes = collectPaths(node);
  const refs = scanForReferences(srcDir, routes);

  const entries: RouteFrequencyEntry[] = routes.map(r => ({
    path: r,
    referenceCount: refs.get(r)?.length ?? 0,
    referencedBy: refs.get(r) ?? [],
  }));

  entries.sort((a, b) => b.referenceCount - a.referenceCount);

  return {
    entries,
    totalRoutes: entries.length,
    unreferenced: entries.filter(e => e.referenceCount === 0).length,
    mostReferenced: entries[0] ?? null,
  };
}

export function formatFrequencyReport(report: FrequencyReport): string {
  const lines: string[] = [
    `Route Frequency Report`,
    `Total routes: ${report.totalRoutes} | Unreferenced: ${report.unreferenced}`,
    '',
  ];
  for (const entry of report.entries) {
    const bar = '█'.repeat(Math.min(entry.referenceCount, 20));
    lines.push(`  ${entry.path.padEnd(40)} ${String(entry.referenceCount).padStart(3)} ${bar}`);
  }
  return lines.join('\n');
}
