import { computeStats, renderSummary } from './summaryRenderer';
import type { RouteNode } from '../scanner/routeScanner';
import type { DeadRouteReport } from '../analyzer/deadRouteAnalyzer';

function makeNode(overrides: Partial<RouteNode> = {}): RouteNode {
  return {
    segment: 'page',
    path: '/page',
    isDynamic: false,
    isGroup: false,
    hasPage: true,
    hasLayout: false,
    children: [],
    ...overrides,
  };
}

function makeReport(deadPaths: string[]): DeadRouteReport {
  return {
    deadRoutes: deadPaths.map((p) => ({ path: p, reason: 'no page file' })),
    scannedAt: new Date().toISOString(),
  };
}

describe('computeStats', () => {
  it('counts flat nodes correctly', () => {
    const nodes = [makeNode({ path: '/a' }), makeNode({ path: '/b', isDynamic: true })];
    const stats = computeStats(nodes, makeReport([]));
    expect(stats.totalRoutes).toBe(2);
    expect(stats.dynamicRoutes).toBe(1);
    expect(stats.deadRoutes).toBe(0);
    expect(stats.coveragePercent).toBe(100);
  });

  it('counts nested children', () => {
    const child = makeNode({ path: '/a/b', isGroup: true });
    const nodes = [makeNode({ path: '/a', children: [child] })];
    const stats = computeStats(nodes, makeReport(['/a/b']));
    expect(stats.totalRoutes).toBe(2);
    expect(stats.groupRoutes).toBe(1);
    expect(stats.deadRoutes).toBe(1);
    expect(stats.coveragePercent).toBe(50);
  });

  it('returns 100% coverage when no routes exist', () => {
    const stats = computeStats([], makeReport([]));
    expect(stats.coveragePercent).toBe(100);
  });
});

describe('renderSummary', () => {
  it('includes all stat labels', () => {
    const stats = computeStats([makeNode()], makeReport([]));
    const output = renderSummary(stats);
    expect(output).toContain('Total routes');
    expect(output).toContain('Dead routes');
    expect(output).toContain('Coverage');
  });

  it('renders dead count in output', () => {
    const stats = { totalRoutes: 5, deadRoutes: 2, dynamicRoutes: 1, groupRoutes: 0, coveragePercent: 60 };
    const output = renderSummary(stats);
    expect(output).toContain('2');
    expect(output).toContain('60%');
  });
});
