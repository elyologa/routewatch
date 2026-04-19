import { exportRoutes, flattenToExported } from './routeExporter';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  children: RouteNode[] = [],
  hasPage = true,
  hasLayout = false
): RouteNode {
  return { segment, children, hasPage, hasLayout };
}

describe('exportRoutes', () => {
  it('returns empty for root with no children', () => {
    const root = makeNode('');
    expect(exportRoutes(root)).toEqual([]);
  });

  it('exports a simple static route', () => {
    const root = makeNode('', [makeNode('about')]);
    const result = exportRoutes(root);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/about');
    expect(result[0].isDynamic).toBe(false);
    expect(result[0].isCatchAll).toBe(false);
    expect(result[0].hasPage).toBe(true);
  });

  it('marks dynamic segments', () => {
    const root = makeNode('', [makeNode('[id]')]);
    const result = exportRoutes(root);
    expect(result[0].isDynamic).toBe(true);
    expect(result[0].isCatchAll).toBe(false);
  });

  it('marks catch-all segments', () => {
    const root = makeNode('', [makeNode('[...slug]')]);
    const result = exportRoutes(root);
    expect(result[0].isCatchAll).toBe(true);
    expect(result[0].isDynamic).toBe(false);
  });

  it('handles nested routes with correct depth', () => {
    const root = makeNode('', [
      makeNode('blog', [makeNode('[slug]')]),
    ]);
    const result = exportRoutes(root);
    expect(result).toHaveLength(2);
    expect(result[0].path).toBe('/blog');
    expect(result[0].depth).toBe(1);
    expect(result[1].path).toBe('/blog/[slug]');
    expect(result[1].depth).toBe(2);
  });

  it('includes hasLayout flag', () => {
    const root = makeNode('', [makeNode('dashboard', [], true, true)]);
    const result = exportRoutes(root);
    expect(result[0].hasLayout).toBe(true);
  });
});
