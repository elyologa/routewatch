import {
  groupBySeverity,
  renderAuditSummary,
  renderAuditIssues,
  renderAuditReport,
} from './auditRenderer';
import { AuditReport, AuditIssue } from '../scanner/routeAudit';

function makeReport(overrides: Partial<AuditReport> = {}): AuditReport {
  return {
    scannedAt: '2024-01-15T10:00:00.000Z',
    totalRoutes: 5,
    issues: [],
    passed: 5,
    failed: 0,
    ...overrides,
  };
}

const sampleIssues: AuditIssue[] = [
  { route: '/Admin', severity: 'error', code: 'UPPERCASE_SEGMENT', message: 'Has uppercase.' },
  { route: '/empty', severity: 'warning', code: 'EMPTY_SEGMENT', message: 'No page or children.' },
  { route: '/info', severity: 'info', code: 'SOME_INFO', message: 'Just info.' },
];

describe('groupBySeverity', () => {
  it('groups issues by severity', () => {
    const grouped = groupBySeverity(sampleIssues);
    expect(grouped.error).toHaveLength(1);
    expect(grouped.warning).toHaveLength(1);
    expect(grouped.info).toHaveLength(1);
  });

  it('returns empty arrays when no issues', () => {
    const grouped = groupBySeverity([]);
    expect(grouped.error).toHaveLength(0);
    expect(grouped.warning).toHaveLength(0);
  });
});

describe('renderAuditSummary', () => {
  it('includes route counts', () => {
    const report = makeReport({ totalRoutes: 10, passed: 8, failed: 2 });
    const output = renderAuditSummary(report);
    expect(output).toContain('Routes  : 10');
    expect(output).toContain('Passed  : 8');
    expect(output).toContain('Failed  : 2');
  });

  it('includes formatted date', () => {
    const report = makeReport();
    const output = renderAuditSummary(report);
    expect(output).toContain('2024-01-15');
  });
});

describe('renderAuditIssues', () => {
  it('shows clean message when no issues', () => {
    const output = renderAuditIssues(makeReport());
    expect(output).toContain('All routes passed');
  });

  it('renders issues grouped by severity', () => {
    const report = makeReport({ issues: sampleIssues });
    const output = renderAuditIssues(report);
    expect(output).toContain('ERROR');
    expect(output).toContain('WARNING');
    expect(output).toContain('UPPERCASE_SEGMENT');
  });
});

describe('renderAuditReport', () => {
  it('combines summary and issues', () => {
    const report = makeReport({ issues: sampleIssues, failed: 1 });
    const output = renderAuditReport(report);
    expect(output).toContain('Audit Summary');
    expect(output).toContain('UPPERCASE_SEGMENT');
  });
});
