import { traceRoutes, formatTraceReport, TraceReport } from './routeTracer';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  children: RouteNode[] = [],
  hasPage = true
): RouteNode {
  return { segment, children, hasPage };
}

describe('traceRoutes', () => {
  it('traces a single root node', () => {
    const root = makeNode('');
    const report = traceRoutes(root);
    expect(report.totalRoutes).toBe(1);
    expect(report.maxDepth).toBe(0);
    expect(report.leafCount).toBe(1);
    expect(report.entries[0].route).toBe('/');
    expect(report.entries[0].parent).toBeNull();
  });

  it('traces nested routes', () => {
    const root = makeNode('', [
      makeNode('about'),
      makeNode('blog', [makeNode('[slug]')]),
    ]);
    const report = traceRoutes(root);
    expect(report.totalRoutes).toBe(4);
    expect(report.maxDepth).toBe(2);
  });

  it('marks dynamic segments', () => {
    const root = makeNode('', [makeNode('[id]')]);
    const report = traceRoutes(root);
    const dynamic = report.entries.find(e => e.route === '/[id]');
    expect(dynamic?.isDynamic).toBe(true);
    expect(dynamic?.isCatchAll).toBe(false);
  });

  it('marks catch-all segments', () => {
    const root = makeNode('', [makeNode('[...slug]')]);
    const report = traceRoutes(root);
    const ca = report.entries.find(e => e.route === '/[...slug]');
    expect(ca?.isCatchAll).toBe(true);
  });

  it('records children paths', () => {
    const root = makeNode('', [makeNode('docs', [makeNode('intro')])]);
    const report = traceRoutes(root);
    const docs = report.entries.find(e => e.route === '/docs');
    expect(docs?.children).toContain('/docs/intro');
    expect(docs?.isLeaf).toBe(false);
  });

  it('counts leaf routes', () => {
    const root = makeNode('', [
      makeNode('a'),
      makeNode('b'),
    ]);
    const report = traceRoutes(root);
    expect(report.leafCount).toBe(2);
  });
});

describe('formatTraceReport', () => {
  it('includes summary headers', () => {
    const root = makeNode('', [makeNode('about')]);
    const report = traceRoutes(root);
    const output = formatTraceReport(report);
    expect(output).toContain('Total routes');
    expect(output).toContain('Max depth');
    expect(output).toContain('Leaf routes');
  });

  it('annotates dynamic routes', () => {
    const root = makeNode('', [makeNode('[id]')]);
    const report = traceRoutes(root);
    const output = formatTraceReport(report);
    expect(output).toContain('[dynamic');
  });
});
