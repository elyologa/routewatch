import { AuditReport, AuditIssue } from '../scanner/routeAudit';

const SEVERITY_ICON: Record<AuditIssue['severity'], string> = {
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
};

const SEVERITY_ORDER: AuditIssue['severity'][] = ['error', 'warning', 'info'];

export function groupBySeverity(
  issues: AuditIssue[]
): Record<AuditIssue['severity'], AuditIssue[]> {
  return {
    error: issues.filter((i) => i.severity === 'error'),
    warning: issues.filter((i) => i.severity === 'warning'),
    info: issues.filter((i) => i.severity === 'info'),
  };
}

export function renderAuditSummary(report: AuditReport): string {
  const lines: string[] = [
    '┌─ Route Audit Summary ──────────────────────┐',
    `│  Scanned : ${report.scannedAt.slice(0, 19).replace('T', ' ')}`,
    `│  Routes  : ${report.totalRoutes}`,
    `│  Passed  : ${report.passed}`,
    `│  Failed  : ${report.failed}`,
    '└────────────────────────────────────────────┘',
  ];
  return lines.join('\n');
}

export function renderAuditIssues(report: AuditReport): string {
  if (report.issues.length === 0) {
    return '✅  All routes passed the audit.\n';
  }

  const grouped = groupBySeverity(report.issues);
  const lines: string[] = [];

  for (const severity of SEVERITY_ORDER) {
    const group = grouped[severity];
    if (group.length === 0) continue;
    lines.push(`\n${SEVERITY_ICON[severity]} ${severity.toUpperCase()} (${group.length})`);
    for (const issue of group) {
      lines.push(`  ${issue.route}`);
      lines.push(`    [${issue.code}] ${issue.message}`);
    }
  }

  return lines.join('\n');
}

export function renderAuditReport(report: AuditReport): string {
  return [renderAuditSummary(report), renderAuditIssues(report)].join('\n');
}
