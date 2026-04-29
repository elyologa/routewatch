import {
  renderCluster,
  buildClusterSummary,
  renderClusterReport,
} from './clusterRenderer';
import { ClusterReport, RouteCluster } from '../scanner/routeCluster';

function makeCluster(label: string, size: number): RouteCluster {
  const routes = Array.from({ length: size }, (_, i) => `${label}/route${i}`);
  return { label, routes, size };
}

function makeReport(clusters: RouteCluster[]): ClusterReport {
  return {
    clusters,
    totalRoutes: clusters.reduce((s, c) => s + c.size, 0),
    totalClusters: clusters.length,
  };
}

describe('renderCluster', () => {
  it('includes the cluster label and count', () => {
    const c = makeCluster('/api', 5);
    const out = renderCluster(c, 10);
    expect(out).toMatch(/\/api/);
    expect(out).toMatch(/5/);
  });

  it('renders full bar when size equals max', () => {
    const c = makeCluster('/full', 10);
    const out = renderCluster(c, 10);
    expect(out).toContain('█'.repeat(20));
  });
});

describe('buildClusterSummary', () => {
  it('shows cluster and route counts', () => {
    const report = makeReport([makeCluster('/a', 3), makeCluster('/b', 7)]);
    const out = buildClusterSummary(report);
    expect(out).toMatch(/Clusters: 2/);
    expect(out).toMatch(/Routes: 10/);
  });

  it('shows average routes per cluster', () => {
    const report = makeReport([makeCluster('/x', 4), makeCluster('/y', 6)]);
    const out = buildClusterSummary(report);
    expect(out).toMatch(/Avg routes per cluster: 5/);
  });
});

describe('renderClusterReport', () => {
  it('renders header and clusters', () => {
    const report = makeReport([makeCluster('/dashboard', 4)]);
    const out = renderClusterReport(report);
    expect(out).toMatch(/Route Cluster Report/);
    expect(out).toMatch(/\/dashboard/);
  });
});
