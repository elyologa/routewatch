import * as fs from 'fs';
import * as path from 'path';
import { RouteNode } from '../scanner/routeScanner';

export interface BreakerRule {
  pattern: string;
  reason: string;
}

export interface BrokenRoute {
  path: string;
  segment: string;
  issues: string[];
}

export interface BreakerReport {
  broken: BrokenRoute[];
  total: number;
  brokenCount: number;
}

function buildPath(node: RouteNode, parent: string): string {
  const segment = node.segment === '' ? '' : `/${node.segment}`;
  return `${parent}${segment}`;
}

function matchesRule(segment: string, pattern: string): boolean {
  try {
    const re = new RegExp(pattern);
    return re.test(segment);
  } catch {
    return segment.includes(pattern);
  }
}

function checkNode(
  node: RouteNode,
  rules: BreakerRule[],
  parent: string,
  results: BrokenRoute[]
): void {
  const routePath = buildPath(node, parent);
  const issues: string[] = [];

  for (const rule of rules) {
    if (matchesRule(node.segment, rule.pattern)) {
      issues.push(rule.reason);
    }
  }

  if (issues.length > 0) {
    results.push({ path: routePath, segment: node.segment, issues });
  }

  for (const child of node.children ?? []) {
    checkNode(child, rules, routePath, results);
  }
}

export function detectBrokenRoutes(
  root: RouteNode,
  rules: BreakerRule[]
): BreakerReport {
  const broken: BrokenRoute[] = [];
  checkNode(root, rules, '', broken);
  return {
    broken,
    total: broken.length + (broken.length === 0 ? 1 : 0),
    brokenCount: broken.length,
  };
}

export function formatBreakerReport(report: BreakerReport): string {
  if (report.brokenCount === 0) {
    return '\x1b[32m✔ No broken route patterns detected.\x1b[0m\n';
  }
  const lines: string[] = [
    `\x1b[31m✖ ${report.brokenCount} broken route(s) detected:\x1b[0m`,
  ];
  for (const r of report.broken) {
    lines.push(`  \x1b[33m${r.path || '/'}\x1b[0m`);
    for (const issue of r.issues) {
      lines.push(`    - ${issue}`);
    }
  }
  return lines.join('\n') + '\n';
}
