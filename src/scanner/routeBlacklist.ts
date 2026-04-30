import { RouteNode } from '../scanner/routeScanner';

export interface BlacklistRule {
  pattern: string;
  reason?: string;
}

export interface BlacklistedRoute {
  path: string;
  rule: BlacklistRule;
}

export interface BlacklistReport {
  blacklisted: BlacklistedRoute[];
  total: number;
}

export function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

export function matchesRule(path: string, rule: BlacklistRule): boolean {
  const escaped = rule.pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`).test(path);
}

export function walk(
  node: RouteNode,
  rules: BlacklistRule[],
  results: BlacklistedRoute[],
  parent = ''
): void {
  const path = buildPath(node, parent);
  for (const rule of rules) {
    if (matchesRule(path, rule)) {
      results.push({ path, rule });
      break;
    }
  }
  for (const child of node.children ?? []) {
    walk(child, rules, results, path);
  }
}

export function checkBlacklist(
  root: RouteNode,
  rules: BlacklistRule[]
): BlacklistReport {
  const blacklisted: BlacklistedRoute[] = [];
  for (const child of root.children ?? []) {
    walk(child, rules, blacklisted);
  }
  return { blacklisted, total: blacklisted.length };
}

export function formatBlacklistReport(report: BlacklistReport): string {
  if (report.total === 0) {
    return '✅ No blacklisted routes found.\n';
  }
  const lines: string[] = [`🚫 Blacklisted Routes (${report.total}):\n`];
  for (const entry of report.blacklisted) {
    const reason = entry.rule.reason ? ` — ${entry.rule.reason}` : '';
    lines.push(`  ${entry.path}  [pattern: ${entry.rule.pattern}${reason}]`);
  }
  return lines.join('\n') + '\n';
}
