import { assessImpact, formatImpactReport } from './routeImpact';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  children: RouteNode[] = [],
  isDynamic = false
): RouteNode {
  return { segment, children, isDynamic, hasPage: true, path: segment };
}

describe('assessImpact', () => {
  it('marks root with many children as critical', () => {
    const root = makeNode('/', [
      makeNode('a', [makeNode('b'), makeNode('c'), makeNode('d'), makeNode('e'), makeNode('f'), makeNode('g'), makeNode('h')]),
    ]);
    const report = assessImpact(root);
    const rootEntry = report.entries.find((e) => e.path === '/');
    expect(rootEntry).toBeDefined();
    expect(['critical', 'high']).toContain(rootEntry!.level);
  });

  it('scores dynamic segments higher', () => {
    const root = makeNode('/', [
      makeNode('[id]', [], true),
      makeNode('about'),
    ]);
    const report = assessImpact(root);
    const dynamic = report.entries.find((e) => e.path === '/[id]');
    const staticRoute = report.entries.find((e) => e.path === '/about');
    expect(dynamic!.score).toBeGreaterThan(staticRoute!.score);
  });

  it('returns correct totalRoutes count', () => {
    const root = makeNode('/', [makeNode('a'), makeNode('b')]);
    const report = assessImpact(root);
    expect(report.totalRoutes).toBe(3);
  });

  it('leaf nodes with no children have low level', () => {
    const root = makeNode('/', [makeNode('leaf')]);
    const report = assessImpact(root);
    const leaf = report.entries.find((e) => e.path === '/leaf');
    expect(leaf!.level).toBe('low');
    expect(leaf!.dependents).toHaveLength(0);
  });
});

describe('formatImpactReport', () => {
  it('includes route count in header', () => {
    const root = makeNode('/', [makeNode('x')]);
    const report = assessImpact(root);
    const output = formatImpactReport(report);
    expect(output).toContain('2 routes');
  });

  it('lists routes sorted by score descending', () => {
    const root = makeNode('/', [
      makeNode('a', [makeNode('b'), makeNode('c')]),
      makeNode('z'),
    ]);
    const report = assessImpact(root);
    const output = formatImpactReport(report);
    const lines = output.split('\n').filter((l) => l.includes('score:'));
    const scores = lines.map((l) => parseInt(l.match(/score: (\d+)/)![1]));
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i - 1]).toBeGreaterThanOrEqual(scores[i]);
    }
  });
});
