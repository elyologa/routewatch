import { analyzeComplexity, formatComplexityReport } from './routeComplexity';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  opts: { isPage?: boolean; isLayout?: boolean; children?: RouteNode[] } = {}
): RouteNode {
  return {
    segment,
    isPage: opts.isPage ?? false,
    isLayout: opts.isLayout ?? false,
    children: opts.children ?? [],
  };
}

describe('analyzeComplexity', () => {
  it('returns empty report for a root with no pages', () => {
    const root = makeNode('', { children: [] });
    const report = analyzeComplexity(root);
    expect(report.routes).toHaveLength(0);
    expect(report.averageScore).toBe(0);
    expect(report.mostComplex).toBeNull();
  });

  it('scores a simple static page with low complexity', () => {
    const root = makeNode('', {
      children: [makeNode('about', { isPage: true })],
    });
    const report = analyzeComplexity(root);
    expect(report.routes).toHaveLength(1);
    expect(report.routes[0].path).toBe('/about');
    expect(report.routes[0].depth).toBe(1);
    expect(report.routes[0].dynamicSegments).toBe(0);
    expect(report.routes[0].level).toBe('low');
  });

  it('adds extra score for dynamic segments', () => {
    const root = makeNode('', {
      children: [
        makeNode('users', {
          children: [makeNode('[id]', { isPage: true })],
        }),
      ],
    });
    const report = analyzeComplexity(root);
    const route = report.routes[0];
    expect(route.dynamicSegments).toBe(1);
    expect(route.score).toBe(2 + 1 * 2); // depth 2 + 1 dynamic
  });

  it('adds extra score for catch-all segments', () => {
    const root = makeNode('', {
      children: [
        makeNode('docs', {
          children: [makeNode('[...slug]', { isPage: true })],
        }),
      ],
    });
    const report = analyzeComplexity(root);
    const route = report.routes[0];
    expect(route.catchAllSegments).toBe(1);
    expect(route.score).toBe(2 + 1 * 3); // depth 2 + 1 catch-all
  });

  it('identifies the most complex route', () => {
    const root = makeNode('', {
      children: [
        makeNode('about', { isPage: true }),
        makeNode('api', {
          children: [
            makeNode('[version]', {
              children: [makeNode('[...path]', { isPage: true })],
            }),
          ],
        }),
      ],
    });
    const report = analyzeComplexity(root);
    expect(report.mostComplex?.path).toBe('/api/[version]/[...path]');
  });

  it('computes the correct averageScore across multiple routes', () => {
    const root = makeNode('', {
      children: [
        makeNode('about', { isPage: true }), // depth 1, score 1
        makeNode('users', {
          children: [makeNode('[id]', { isPage: true })], // depth 2 + 1 dynamic = score 4
        }),
      ],
    });
    const report = analyzeComplexity(root);
    expect(report.routes).toHaveLength(2);
    const expectedAverage = (1 + 4) / 2;
    expect(report.averageScore).toBe(expectedAverage);
  });
});

describe('formatComplexityReport', () => {
  it('includes header and per-route lines', () => {
    const root = makeNode('', {
      children: [makeNode('home', { isPage: true })],
    });
    const report = analyzeComplexity(root);
    const output = formatComplexityReport(report);
    expect(output).toContain('Route Complexity Report');
    expect(output).toContain('/home');
    expect(output).toContain('score:');
  });
});
