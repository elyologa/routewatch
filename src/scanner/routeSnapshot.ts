import fs from 'fs';
import path from 'path';
import { RouteNode } from './routeScanner';

export interface RouteSnapshot {
  timestamp: string;
  version: number;
  paths: string[];
}

export function buildPath(node: RouteNode, base = ''): string {
  return base ? `${base}/${node.segment}` : node.segment || '/';
}

export function collectPaths(node: RouteNode, base = ''): string[] {
  const current = buildPath(node, base);
  const results: string[] = [];
  if (node.isRoute) results.push(current);
  for (const child of node.children ?? []) {
    results.push(...collectPaths(child, current));
  }
  return results;
}

export function createSnapshot(node: RouteNode): RouteSnapshot {
  return {
    timestamp: new Date().toISOString(),
    version: 1,
    paths: collectPaths(node),
  };
}

export function saveSnapshot(snapshot: RouteSnapshot, filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
}

export function loadSnapshot(filePath: string): RouteSnapshot {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as RouteSnapshot;
}

export function diffSnapshots(
  before: RouteSnapshot,
  after: RouteSnapshot
): { added: string[]; removed: string[] } {
  const beforeSet = new Set(before.paths);
  const afterSet = new Set(after.paths);
  return {
    added: after.paths.filter((p) => !beforeSet.has(p)),
    removed: before.paths.filter((p) => !afterSet.has(p)),
  };
}
