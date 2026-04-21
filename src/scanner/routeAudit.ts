import * as fs from 'fs';
import * as path from 'path';
import { RouteNode } from '../scanner/routeScanner';

export interface AuditIssue {
  route: string;
  severity: 'error' | 'warning' | 'info';
  code: string;
  message: string;
}

export interface AuditReport {
  scannedAt: string;
  totalRoutes: number;
  issues: AuditIssue[];
  passed: number;
  failed: number;
}

export function buildPath(node: RouteNode, parent = ''): string {
  const segment = node.segment === 'index' ? '' : node.segment;
  return parent ? `${parent}/${segment}`.replace(/\/+/g, '/') : `/${segment}`;
}

export function auditNode(
  node: RouteNode,
  parentPath: string,
  issues: AuditIssue[]
): void {
  const route = buildPath(node, parentPath);

  if (!node.hasPage && !node.hasLayout && node.children.length === 0) {
    issues.push({
      route,
      severity: 'warning',
      code: 'EMPTY_SEGMENT',
      message: `Segment "${route}" has no page, layout, or children.`,
    });
  }

  if (/[A-Z]/.test(node.segment)) {
    issues.push({
      route,
      severity: 'error',
      code: 'UPPERCASE_SEGMENT',
      message: `Segment "${node.segment}" contains uppercase letters; Next.js routes are case-sensitive.`,
    });
  }

  const dynamicCount = node.children.filter(
    (c) => c.segment.startsWith('[') && !c.segment.startsWith('[...')
  ).length;
  if (dynamicCount > 1) {
    issues.push({
      route,
      severity: 'error',
      code: 'MULTIPLE_DYNAMIC_SIBLINGS',
      message: `Route "${route}" has ${dynamicCount} dynamic sibling segments, which is ambiguous.`,
    });
  }

  for (const child of node.children) {
    auditNode(child, route, issues);
  }
}

export function auditRoutes(root: RouteNode): AuditReport {
  const issues: AuditIssue[] = [];
  let total = 0;

  function countAndAudit(node: RouteNode, parent: string) {
    total++;
    auditNode(node, parent, issues);
    for (const child of node.children) {
      countAndAudit(child, buildPath(node, parent));
    }
  }

  for (const child of root.children) {
    countAndAudit(child, '');
  }

  const failed = issues.filter((i) => i.severity === 'error').length;
  return {
    scannedAt: new Date().toISOString(),
    totalRoutes: total,
    issues,
    passed: total - failed,
    failed,
  };
}

export function formatAuditReport(report: AuditReport): string {
  const lines: string[] = [
    `Route Audit — ${report.scannedAt}`,
    `Routes scanned: ${report.totalRoutes}  |  Passed: ${report.passed}  |  Failed: ${report.failed}`,
    '',
  ];
  if (report.issues.length === 0) {
    lines.push('✅ No issues found.');
  } else {
    for (const issue of report.issues) {
      const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`${icon} [${issue.code}] ${issue.route}`);
      lines.push(`   ${issue.message}`);
    }
  }
  return lines.join('\n');
}
