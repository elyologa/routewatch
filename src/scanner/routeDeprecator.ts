import { RouteNode } from './routeScanner';

export interface DeprecationRule {
  pattern: string;
  reason?: string;
  since?: string;
}

export interface DeprecatedRoute {
  path: string;
  reason: string;
  since?: string;
}

function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function matchesRule(path: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(path);
}

export function collectDeprecated(
  node: RouteNode,
  rules: DeprecationRule[],
  parent = '',
  results: DeprecatedRoute[] = []
): DeprecatedRoute[] {
  const path = buildPath(node, parent);
  for (const rule of rules) {
    if (matchesRule(path, rule.pattern)) {
      results.push({
        path,
        reason: rule.reason ?? 'Deprecated route',
        since: rule.since,
      });
      break;
    }
  }
  for (const child of node.children ?? []) {
    collectDeprecated(child, rules, path, results);
  }
  return results;
}

export function formatDeprecated(routes: DeprecatedRoute[]): string {
  if (routes.length === 0) return 'No deprecated routes found.';
  return routes
    .map(r => {
      const since = r.since ? ` (since ${r.since})` : '';
      return `  ⚠  ${r.path}${since}: ${r.reason}`;
    })
    .join('\n');
}
