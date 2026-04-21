import { auditRoutes, auditNode, formatAuditReport, AuditIssue } from './routeAudit';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  opts: Partial<RouteNode> = {}
): RouteNode {
  return {
    segment,
    hasPage: false,
    hasLayout: false,
    hasLoading: false,
    hasError: false,
    children: [],
    ...opts,
  };
}

describe('auditNode', () => {
  it('flags empty segments with no page or children', () => {
    const issues: AuditIssue[] = [];
    auditNode(makeNode('about'), '', issues);
    expect(issues).toHaveLength(1);
    expect(issues[0].code).toBe('EMPTY_SEGMENT');
  });

  it('does not flag segment with a page', () => {
    const issues: AuditIssue[] = [];
    auditNode(makeNode('about', { hasPage: true }), '', issues);
    expect(issues).toHaveLength(0);
  });

  it('flags uppercase segment names', () => {
    const issues: AuditIssue[] = [];
    auditNode(makeNode('About', { hasPage: true }), '', issues);
    expect(issues.some((i) => i.code === 'UPPERCASE_SEGMENT')).toBe(true);
  });

  it('flags multiple dynamic siblings', () => {
    const issues: AuditIssue[] = [];
    const parent = makeNode('users', {
      hasPage: true,
      children: [
        makeNode('[id]', { hasPage: true }),
        makeNode('[slug]', { hasPage: true }),
      ],
    });
    auditNode(parent, '', issues);
    expect(issues.some((i) => i.code === 'MULTIPLE_DYNAMIC_SIBLINGS')).toBe(true);
  });
});

describe('auditRoutes', () => {
  it('returns a report with correct counts', () => {
    const root = makeNode('root', {
      children: [
        makeNode('about', { hasPage: true }),
        makeNode('contact', { hasPage: true }),
      ],
    });
    const report = auditRoutes(root);
    expect(report.totalRoutes).toBe(2);
    expect(report.issues).toHaveLength(0);
    expect(report.failed).toBe(0);
  });

  it('counts errors in failed field', () => {
    const root = makeNode('root', {
      children: [makeNode('BadRoute', { hasPage: true })],
    });
    const report = auditRoutes(root);
    expect(report.failed).toBeGreaterThan(0);
  });
});

describe('formatAuditReport', () => {
  it('shows no issues message when clean', () => {
    const root = makeNode('root', {
      children: [makeNode('home', { hasPage: true })],
    });
    const report = auditRoutes(root);
    const output = formatAuditReport(report);
    expect(output).toContain('No issues found');
  });

  it('includes issue codes in output', () => {
    const root = makeNode('root', {
      children: [makeNode('BadSeg', { hasPage: true })],
    });
    const report = auditRoutes(root);
    const output = formatAuditReport(report);
    expect(output).toContain('UPPERCASE_SEGMENT');
  });
});
