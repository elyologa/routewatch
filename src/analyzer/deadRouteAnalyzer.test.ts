import { findDeadRoutes, buildReport } from './deadRouteAnalyzer';
import { RouteNode } from '../scanner/routeScanner';

function makeNode(overrides: Partial<RouteNode> & { routePath: string }): RouteNode {
  return {
    segment: overrides.routePath.split('/').pop() || '',
    routePath: overrides.routePath,
    hasPage: false,
    hasLayout: false,
    hasApiRoute: false,
    children: [],
    ...overrides,
  };
}

describe('findDeadRoutes', () => {
  it('flags a leaf node with no page or API route', () => {
    const nodes = [makeNode({ routePath: '/orphan' })];
    const result = findDeadRoutes(nodes);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/orphan');
  });

  it('does not flag a node with a page', () => {
    const nodes = [makeNode({ routePath: '/about', hasPage: true })];
    const result = findDeadRoutes(nodes);
    expect(result).toHaveLength(0);
  });

  it('does not flag a node with an API route', () => {
    const nodes = [makeNode({ routePath: '/api/data', hasApiRoute: true })];
    const result = findDeadRoutes(nodes);
    expect(result).toHaveLength(0);
  });

  it('flags intermediate segment with children but no layout or page', () => {
    const child = makeNode({ routePath: '/dashboard/settings', hasPage: true });
    const parent = makeNode({ routePath: '/dashboard', children: [child] });
    const result = findDeadRoutes([parent]);
    expect(result.some((r) => r.path === '/dashboard')).toBe(true);
  });

  it('does not flag intermediate segment that has a layout', () => {
    const child = makeNode({ routePath: '/dashboard/settings', hasPage: true });
    const parent = makeNode({ routePath: '/dashboard', hasLayout: true, children: [child] });
    const result = findDeadRoutes([parent]);
    expect(result.some((r) => r.path === '/dashboard')).toBe(false);
  });
});

describe('buildReport', () => {
  it('returns correct totals', () => {
    const nodes = [
      makeNode({ routePath: '/home', hasPage: true }),
      makeNode({ routePath: '/ghost' }),
    ];
    const report = buildReport(nodes);
    expect(report.totalRoutes).toBe(2);
    expect(report.deadRoutes).toHaveLength(1);
    expect(report.activeRoutes).toContain('/home');
    expect(report.activeRoutes).not.toContain('/ghost');
  });
});
