import { scoreRoutes, formatScores } from './routeScorer';
import { RouteNode } from './routeScanner';

function makeNode(overrides: Partial<RouteNode> & { segment: string }): RouteNode {
  return {
    segment: overrides.segment,
    isDynamic: false,
    isCatchAll: false,
    hasPage: false,
    hasLayout: false,
    hasLoading: false,
    hasError: false,
    children: [],
    ...overrides,
  };
}

describe('scoreRoutes', () => {
  it('returns empty array for root with no children', () => {
    const root = makeNode({ segment: '' });
    expect(scoreRoutes(root)).toEqual([]);
  });

  it('scores a simple page route', () => {
    const root = makeNode({
      segment: '',
      children: [makeNode({ segment: 'about', hasPage: true })],
    });
    const results = scoreRoutes(root);
    expect(results).toHaveLength(1);
    expect(results[0].path).toBe('/about');
    expect(results[0].score).toBeGreaterThan(0);
    expect(results[0].reasons).toContain('has page (+5)');
  });

  it('gives higher score to dynamic routes', () => {
    const root = makeNode({
      segment: '',
      children: [
        makeNode({ segment: 'static', hasPage: true }),
        makeNode({ segment: '[id]', hasPage: true, isDynamic: true }),
      ],
    });
    const results = scoreRoutes(root);
    const dynamic = results.find(r => r.path === '/[id]')!;
    const staticR = results.find(r => r.path === '/static')!;
    expect(dynamic.score).toBeGreaterThan(staticR.score);
  });

  it('accounts for depth in scoring', () => {
    const root = makeNode({
      segment: '',
      children: [
        makeNode({
          segment: 'a',
          hasPage: true,
          children: [makeNode({ segment: 'b', hasPage: true })],
        }),
      ],
    });
    const results = scoreRoutes(root);
    const deep = results.find(r => r.path === '/a/b')!;
    const shallow = results.find(r => r.path === '/a')!;
    expect(deep.score).toBeGreaterThan(shallow.score);
  });
});

describe('formatScores', () => {
  it('returns message when no routes', () => {
    expect(formatScores([])).toBe('No routes to score.');
  });

  it('formats scored routes', () => {
    const output = formatScores([{ path: '/about', score: 6, reasons: ['has page (+5)', 'depth 1 (+1)'] }]);
    expect(output).toContain('/about');
    expect(output).toContain('score: 6');
  });
});
