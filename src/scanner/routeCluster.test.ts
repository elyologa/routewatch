import { clusterRoutes, formatClusterReport } from './routeCluster';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  children: RouteNode[] = [],
  hasPage = true
): RouteNode {
  return { segment, children, hasPage };
}

describe('clusterRoutes', () => {
  const tree = makeNode('', [
    makeNode('dashboard', [
      makeNode('overview'),
      makeNode('settings'),
    ]),
    makeNode('blog', [
      makeNode('[slug]'),
      makeNode('archive'),
    ]),
    makeNode('about'),
  ]);

  it('clusters routes by top-level prefix', () => {
    const report = clusterRoutes(tree, 1);
    expect(report.totalClusters).toBeGreaterThanOrEqual(3);
    const labels = report.clusters.map((c) => c.label);
    expect(labels).toContain('/dashboard');
    expect(labels).toContain('/blog');
  });

  it('returns correct total route count', () => {
    const report = clusterRoutes(tree, 1);
    expect(report.totalRoutes).toBeGreaterThan(0);
  });

  it('sorts clusters by size descending', () => {
    const report = clusterRoutes(tree, 1);
    for (let i = 1; i < report.clusters.length; i++) {
      expect(report.clusters[i - 1].size).toBeGreaterThanOrEqual(
        report.clusters[i].size
      );
    }
  });

  it('handles leaf-only tree', () => {
    const leaf = makeNode('about');
    const report = clusterRoutes(leaf, 1);
    expect(report.totalRoutes).toBe(1);
    expect(report.totalClusters).toBe(1);
  });
});

describe('formatClusterReport', () => {
  it('includes header and cluster labels', () => {
    const tree = makeNode('', [makeNode('api', [makeNode('users')])]);
    const report = clusterRoutes(tree, 1);
    const output = formatClusterReport(report);
    expect(output).toMatch(/Route Clusters/);
    expect(output).toMatch(/\/api/);
  });
});
