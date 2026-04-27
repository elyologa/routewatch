import { detectOrphans, formatOrphanReport, OrphanReport } from './routeOrphans';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  files: string[] = [],
  children: RouteNode[] = []
): RouteNode {
  return { segment, files, children };
}

describe('detectOrphans', () => {
  it('returns empty report when all routes have pages', () => {
    const root = makeNode('dashboard', ['page.tsx'], [
      makeNode('settings', ['page.tsx']),
    ]);
    const report = detectOrphans([root]);
    expect(report.total).toBe(0);
    expect(report.orphans).toHaveLength(0);
  });

  it('detects a leaf node with no page file', () => {
    const root = makeNode('dashboard', []);
    const report = detectOrphans([root]);
    expect(report.total).toBe(1);
    expect(report.orphans[0].routePath).toBe('/dashboard');
    expect(report.orphans[0].reason).toMatch(/No page file/);
  });

  it('detects parent with children but none are routable', () => {
    const root = makeNode('admin', [], [
      makeNode('_helpers', []),
    ]);
    const report = detectOrphans([root]);
    // admin has no page and its only child is private (skipped), so admin is orphan
    expect(report.orphans.some(o => o.routePath === '/admin')).toBe(true);
  });

  it('skips group segments from orphan detection', () => {
    const root = makeNode('(marketing)', [], [
      makeNode('about', ['page.tsx']),
    ]);
    const report = detectOrphans([root]);
    expect(report.orphans.some(o => o.segment === '(marketing)')).toBe(false);
  });

  it('skips private segments from orphan detection', () => {
    const root = makeNode('_components', []);
    const report = detectOrphans([root]);
    expect(report.orphans.some(o => o.segment === '_components')).toBe(false);
  });

  it('handles multiple roots', () => {
    const roots = [
      makeNode('blog', ['page.tsx']),
      makeNode('shop', []),
    ];
    const report = detectOrphans(roots);
    expect(report.total).toBe(1);
    expect(report.orphans[0].segment).toBe('shop');
  });

  it('detects orphans in deeply nested routes', () => {
    const root = makeNode('app', ['page.tsx'], [
      makeNode('users', ['page.tsx'], [
        makeNode('profile', []),
      ]),
    ]);
    const report = detectOrphans([root]);
    expect(report.total).toBe(1);
    expect(report.orphans[0].routePath).toBe('/app/users/profile');
  });
});

describe('formatOrphanReport', () => {
  it('prints success message when no orphans', () => {
    const report: OrphanReport = { orphans: [], total: 0, scannedAt: new Date() };
    const output = formatOrphanReport(report);
    expect(output).toContain('No orphan routes detected');
  });

  it('lists orphan routes when present', () => {
    const report: OrphanReport = {
      orphans: [{ routePath: '/empty', segment: 'empty', reason: 'No page file and no children' }],
      total: 1,
      scannedAt: new Date(),
    };
    const output = formatOrphanReport(report);
    expect(output).toContain('1 orphan route(s)');
    expect(output).toContain('/empty');
    expect(output).toContain('No page file and no children');
  });
});
