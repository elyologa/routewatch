import { computeRouteStats, formatStats } from './routeStats';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, isRoute: boolean, children: RouteNode[] = []): RouteNode {
  return { segment, isRoute, children };
}

describe('computeRouteStats', () => {
  it('returns zeros for empty root', () => {
    const root = makeNode('', false);
    const stats = computeRouteStats(root);
    expect(stats.totalRoutes).toBe(0);
    expect(stats.maxDepth).toBe(0);
    expect(stats.avgDepth).toBe(0);
  });

  it('counts static routes', () => {
    const root = makeNode('', false, [
      makeNode('about', true),
      makeNode('contact', true),
    ]);
    const stats = computeRouteStats(root);
    expect(stats.totalRoutes).toBe(2);
    expect(stats.staticRoutes).toBe(2);
    expect(stats.dynamicRoutes).toBe(0);
  });

  it('counts dynamic routes', () => {
    const root = makeNode('', false, [
      makeNode('[id]', true),
      makeNode('about', true),
    ]);
    const stats = computeRouteStats(root);
    expect(stats.dynamicRoutes).toBe(1);
    expect(stats.staticRoutes).toBe(1);
  });

  it('counts catch-all routes', () => {
    const root = makeNode('', false, [
      makeNode('[...slug]', true),
    ]);
    const stats = computeRouteStats(root);
    expect(stats.catchAllRoutes).toBe(1);
    expect(stats.dynamicRoutes).toBe(0);
  });

  it('computes max and avg depth', () => {
    const root = makeNode('', false, [
      makeNode('a', true, [
        makeNode('b', true, [
          makeNode('c', true),
        ]),
      ]),
    ]);
    const stats = computeRouteStats(root);
    expect(stats.maxDepth).toBe(2);
    expect(stats.avgDepth).toBeCloseTo(1);
  });
});

describe('formatStats', () => {
  it('formats stats as multiline string', () => {
    const stats = { totalRoutes: 3, staticRoutes: 2, dynamicRoutes: 1, catchAllRoutes: 0, maxDepth: 2, avgDepth: 1.5 };
    const out = formatStats(stats);
    expect(out).toContain('Total routes   : 3');
    expect(out).toContain('Dynamic        : 1');
    expect(out).toContain('Avg depth      : 1.5');
  });
});
