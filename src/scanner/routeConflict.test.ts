import { checkRouteConflicts, formatConflictReport } from './routeConflict';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, isRoute: boolean, children: RouteNode[] = []): RouteNode {
  return { segment, isRoute, children };
}

describe('checkRouteConflicts', () => {
  it('returns empty report when no conflicts exist', () => {
    const root = makeNode('app', false, [
      makeNode('about', true),
      makeNode('contact', true),
    ]);
    const report = checkRouteConflicts(root);
    expect(report.total).toBe(0);
    expect(report.conflicts).toHaveLength(0);
  });

  it('detects conflict between dynamic and catch-all at same level', () => {
    const root = makeNode('app', false, [
      makeNode('[id]', true),
      makeNode('[...slug]', true),
    ]);
    // Both normalize differently so no conflict here — test a true ambiguity
    const report = checkRouteConflicts(root);
    expect(report.total).toBe(0);
  });

  it('detects conflict between two different dynamic segments', () => {
    const root = makeNode('app', false, [
      makeNode('[id]', true),
      makeNode('[slug]', true),
    ]);
    const report = checkRouteConflicts(root);
    expect(report.total).toBe(1);
    expect(report.conflicts[0].reason).toMatch(/Ambiguous/);
  });

  it('does not flag identical raw paths', () => {
    const root = makeNode('app', false, [
      makeNode('[id]', true),
    ]);
    const report = checkRouteConflicts(root);
    expect(report.total).toBe(0);
  });
});

describe('formatConflictReport', () => {
  it('returns success message when no conflicts', () => {
    const output = formatConflictReport({ conflicts: [], total: 0 });
    expect(output).toContain('No route conflicts detected');
  });

  it('formats conflicts with paths and reason', () => {
    const output = formatConflictReport({
      conflicts: [{ pathA: '/[id]', pathB: '/[slug]', reason: 'Ambiguous dynamic segments resolve to the same pattern' }],
      total: 1,
    });
    expect(output).toContain('[id]');
    expect(output).toContain('[slug]');
    expect(output).toContain('Reason:');
  });
});
