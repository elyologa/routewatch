import { analyzeFlow, formatFlowReport, FlowReport } from './routeFlow';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, hasPage: children.length === 0, path: segment };
}

describe('analyzeFlow', () => {
  it('handles a single root node', () => {
    const root = makeNode('');
    const report = analyzeFlow(root);
    expect(report.graph.nodes).toContain('/');
    expect(report.entryPoints).toContain('/');
    expect(report.leafRoutes).toContain('/');
  });

  it('builds parent edges for children', () => {
    const root = makeNode('', [
      makeNode('about'),
      makeNode('contact'),
    ]);
    const report = analyzeFlow(root);
    const parentEdges = report.graph.edges.filter(e => e.type === 'parent');
    expect(parentEdges.some(e => e.from === '/' && e.to === '/about')).toBe(true);
    expect(parentEdges.some(e => e.from === '/' && e.to === '/contact')).toBe(true);
  });

  it('builds sibling edges between children', () => {
    const root = makeNode('', [
      makeNode('a'),
      makeNode('b'),
    ]);
    const report = analyzeFlow(root);
    const siblingEdges = report.graph.edges.filter(e => e.type === 'sibling');
    expect(siblingEdges.length).toBeGreaterThan(0);
    expect(siblingEdges[0].from).toBe('/a');
    expect(siblingEdges[0].to).toBe('/b');
  });

  it('identifies leaf routes correctly', () => {
    const root = makeNode('', [
      makeNode('blog', [makeNode('[slug]')]),
    ]);
    const report = analyzeFlow(root);
    expect(report.leafRoutes).toContain('/blog/[slug]');
    expect(report.leafRoutes).not.toContain('/');
  });

  it('counts total edges', () => {
    const root = makeNode('', [
      makeNode('x'),
      makeNode('y'),
      makeNode('z'),
    ]);
    const report = analyzeFlow(root);
    // 3 parent edges + 3 sibling pairs
    expect(report.totalEdges).toBe(6);
  });
});

describe('formatFlowReport', () => {
  it('includes summary counts', () => {
    const root = makeNode('', [makeNode('home')]);
    const report = analyzeFlow(root);
    const output = formatFlowReport(report);
    expect(output).toContain('Route Flow Analysis');
    expect(output).toContain('Total nodes');
    expect(output).toContain('Leaf Routes');
  });

  it('lists entry points', () => {
    const root = makeNode('');
    const report = analyzeFlow(root);
    const output = formatFlowReport(report);
    expect(output).toContain('Entry Points');
    expect(output).toContain('/');
  });
});
