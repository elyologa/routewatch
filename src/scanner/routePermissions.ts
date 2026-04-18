import { RouteNode } from './routeScanner';

export interface PermissionRule {
  pattern: string;
  roles: string[];
}

export interface PermissionEntry {
  path: string;
  roles: string[];
}

function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function matchesPattern(path: string, pattern: string): boolean {
  const regex = new RegExp(
    '^' + pattern.replace(/\[.*?\]/g, '[^/]+').replace(/\*/g, '.*') + '$'
  );
  return regex.test(path);
}

export function collectPermissions(
  node: RouteNode,
  rules: PermissionRule[],
  parentPath = ''
): PermissionEntry[] {
  const path = buildPath(node, parentPath);
  const entries: PermissionEntry[] = [];

  const matched = rules.filter(r => matchesPattern(path, r.pattern));
  if (matched.length > 0) {
    const roles = Array.from(new Set(matched.flatMap(r => r.roles)));
    entries.push({ path, roles });
  }

  for (const child of node.children ?? []) {
    entries.push(...collectPermissions(child, rules, path));
  }

  return entries;
}

export function formatPermissions(entries: PermissionEntry[]): string {
  if (entries.length === 0) return 'No permission rules matched any routes.';
  return entries
    .map(e => `${e.path}  →  [${e.roles.join(', ')}]`)
    .join('\n');
}
