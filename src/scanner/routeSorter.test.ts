import { sortRoutes, buildSortableRoute, SortableRoute } from './routeSorter';

function makeRoute(path: string): SortableRoute {
  return buildSortableRoute(path);
}

describe('buildSortableRoute', () => {
  it('sets depth from segments', () => {
    expect(makeRoute('/a/b/c').depth).toBe(3);
  });

  it('detects dynamic segments', () => {
    expect(makeRoute('/users/[id]').isDynamic).toBe(true);
    expect(makeRoute('/users/list').isDynamic).toBe(false);
  });

  it('detects catch-all segments', () => {
    expect(makeRoute('/docs/[...slug]').isCatchAll).toBe(true);
    expect(makeRoute('/docs/[id]').isCatchAll).toBe(false);
  });
});

describe('sortRoutes', () => {
  const routes = [
    makeRoute('/users/[id]'),
    makeRoute('/about'),
    makeRoute('/docs/[...slug]'),
    makeRoute('/contact'),
  ];

  it('sorts by path ascending', () => {
    const result = sortRoutes(routes, { key: 'path', order: 'asc' });
    expect(result[0].path).toBe('/about');
    expect(result[result.length - 1].path).toBe('/users/[id]');
  });

  it('sorts by path descending', () => {
    const result = sortRoutes(routes, { key: 'path', order: 'desc' });
    expect(result[0].path).toBe('/users/[id]');
  });

  it('sorts by depth', () => {
    const result = sortRoutes(routes, { key: 'depth', order: 'asc' });
    expect(result[0].depth).toBeLessThanOrEqual(result[1].depth);
  });

  it('sorts by type: static < dynamic < catch-all', () => {
    const result = sortRoutes(routes, { key: 'type', order: 'asc' });
    const types = result.map(r => r.isCatchAll ? 2 : r.isDynamic ? 1 : 0);
    expect(types).toEqual([...types].sort((a, b) => a - b));
  });

  it('does not mutate original array', () => {
    const original = [...routes];
    sortRoutes(routes, { key: 'path' });
    expect(routes).toEqual(original);
  });
});
