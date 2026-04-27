import { collectLineage, formatLineageReport, RouteLineageEntry } from './routeLineage';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, path: segment } as unknown as RouteNode;
}

describe('collectLineage', () => {
  it('handles a single root node', () => {
    const root = makeNode('');
    const report = collectLineage(root);
    expect(report.entries).toHaveLength(1);
    expect(report.roots).toEqual(['/']);
    expect(report.leaves).toEqual(['/']);
    expect(report.maxDepth).toBe(0);
  });

  it('records correct depth for nested nodes', () => {
    const root = makeNode('', [
      makeNode('about', [
        makeNode('team'),
      ]),
    ]);
    const report = collectLineage(root);
    const depths = report.entries.map((e) => e.depth);
    expect(depths).toEqual([0, 1, 2]);
    expect(report.maxDepth).toBe(2);
  });

  it('identifies leaf routes correctly', () => {
    const root = makeNode('', [
      makeNode('blog'),
      makeNode('contact'),
    ]);
    const report = collectLineage(root);
    expect(report.leaves).toContain('/blog');
    expect(report.leaves).toContain('/contact');
    expect(report.leaves).not.toContain('/');
  });

  it('sets parent reference correctly', () => {
    const root = makeNode('', [makeNode('dashboard', [makeNode('settings')])]);
    const report = collectLineage(root);
    const settings = report.entries.find((e) => e.route === '/dashboard/settings');
    expect(settings?.parent).toBe('/dashboard');
    expect(settings?.ancestors).toEqual(['/', '/dashboard']);
  });

  it('lists children of a node', () => {
    const root = makeNode('', [makeNode('a'), makeNode('b')]);
    const report = collectLineage(root);
    const rootEntry = report.entries.find((e) => e.route === '/');
    expect(rootEntry?.children).toContain('/a');
    expect(rootEntry?.children).toContain('/b');
  });
});

describe('formatLineageReport', () => {
  it('includes summary statistics', () => {
    const root = makeNode('', [makeNode('page')]);
    const report = collectLineage(root);
    const output = formatLineageReport(report);
    expect(output).toContain('Total routes');
    expect(output).toContain('Max depth');
    expect(output).toContain('/page');
  });
});
