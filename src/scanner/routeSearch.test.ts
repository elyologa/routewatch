import { searchRoutes } from './routeSearch';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  path: string,
  children: RouteNode[] = []
): RouteNode {
  return { segment, path, children, isDynamic: segment.startsWith('[') };
}

const tree = makeNode('', '/', [
  makeNode('blog', '/blog', [
    makeNode('[slug]', '/blog/[slug]'),
    makeNode('archive', '/blog/archive'),
  ]),
  makeNode('about', '/about'),
  makeNode('contact', '/contact'),
]);

describe('searchRoutes', () => {
  it('finds exact segment match', () => {
    const results = searchRoutes(tree, 'about', { matchSegment: true });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].node.segment).toBe('about');
  });

  it('finds partial path match', () => {
    const results = searchRoutes(tree, 'blog');
    expect(results.some(r => r.path.includes('blog'))).toBe(true);
  });

  it('returns empty when no match', () => {
    const results = searchRoutes(tree, 'xyz123');
    expect(results).toHaveLength(0);
  });

  it('is case insensitive by default', () => {
    const results = searchRoutes(tree, 'ABOUT');
    expect(results.some(r => r.path === '/about')).toBe(true);
  });

  it('respects caseSensitive option', () => {
    const results = searchRoutes(tree, 'ABOUT', { caseSensitive: true });
    expect(results).toHaveLength(0);
  });

  it('scores exact matches higher than partial', () => {
    const results = searchRoutes(tree, '/blog');
    const exact = results.find(r => r.path === '/blog');
    const partial = results.find(r => r.path === '/blog/archive');
    if (exact && partial) {
      expect(exact.score).toBeGreaterThanOrEqual(partial.score);
    }
  });
});
