import { analyzeTrend, formatTrendReport } from './routeTrend';
import type { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  children: RouteNode[] = [],
  dir?: string
): RouteNode {
  return { segment, children, dir, hasPage: true, hasLayout: false };
}

describe('analyzeTrend', () => {
  it('returns empty report for root with no dir', () => {
    const root = makeNode('');
    const report = analyzeTrend(root);
    expect(report.entries).toHaveLength(0);
    expect(report.averageAgeInDays).toBe(0);
  });

  it('collects entries for nodes with dirs', () => {
    const root = makeNode('', [
      makeNode('about', [], __dirname),
      makeNode('blog', [], __dirname),
    ]);
    const report = analyzeTrend(root);
    expect(report.entries.length).toBeGreaterThanOrEqual(2);
  });

  it('computes growthRate based on children count', () => {
    const node = makeNode('api', [makeNode('users'), makeNode('posts')], __dirname);
    const root = makeNode('', [node]);
    const report = analyzeTrend(root);
    const entry = report.entries.find(e => e.route === '/api');
    expect(entry).toBeDefined();
    expect(entry!.growthRate).toBeGreaterThan(0);
  });

  it('returns fastestGrowing capped at 5', () => {
    const children = Array.from({ length: 8 }, (_, i) =>
      makeNode(`r${i}`, [], __dirname)
    );
    const root = makeNode('', children);
    const report = analyzeTrend(root);
    expect(report.fastestGrowing.length).toBeLessThanOrEqual(5);
  });

  it('newest and oldest are capped at 5', () => {
    const children = Array.from({ length: 10 }, (_, i) =>
      makeNode(`seg${i}`, [], __dirname)
    );
    const root = makeNode('', children);
    const report = analyzeTrend(root);
    expect(report.newest.length).toBeLessThanOrEqual(5);
    expect(report.oldest.length).toBeLessThanOrEqual(5);
  });
});

describe('formatTrendReport', () => {
  it('includes header and average age', () => {
    const root = makeNode('', [makeNode('home', [], __dirname)]);
    const report = analyzeTrend(root);
    const output = formatTrendReport(report);
    expect(output).toContain('Route Trend Analysis');
    expect(output).toContain('Average route age');
  });

  it('lists fastest growing section', () => {
    const root = makeNode('', [makeNode('shop', [makeNode('item')], __dirname)]);
    const report = analyzeTrend(root);
    const output = formatTrendReport(report);
    expect(output).toContain('Fastest Growing');
  });
});
