import { compareRoutes, formatDiff } from './routeComparator';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, routePath: string, children: RouteNode[] = []): RouteNode {
  return { segment, routePath, children, path: '/fake' };
}

describe('compareRoutes', () => {
  it('detects added routes', () => {
    const prev = [makeNode('about', '/about')];
    const curr = [makeNode('about', '/about'), makeNode('contact', '/contact')];
    const diff = compareRoutes(prev, curr);
    expect(diff.added).toContain('/contact');
    expect(diff.removed).toHaveLength(0);
  });

  it('detects removed routes', () => {
    const prev = [makeNode('about', '/about'), makeNode('blog', '/blog')];
    const curr = [makeNode('about', '/about')];
    const diff = compareRoutes(prev, curr);
    expect(diff.removed).toContain('/blog');
    expect(diff.added).toHaveLength(0);
  });

  it('reports unchanged routes', () => {
    const prev = [makeNode('home', '/home')];
    const curr = [makeNode('home', '/home')];
    const diff = compareRoutes(prev, curr);
    expect(diff.unchanged).toContain('/home');
  });

  it('handles empty inputs', () => {
    const diff = compareRoutes([], []);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  it('detects multiple added and removed routes simultaneously', () => {
    const prev = [makeNode('home', '/home'), makeNode('about', '/about')];
    const curr = [makeNode('home', '/home'), makeNode('contact', '/contact'), makeNode('faq', '/faq')];
    const diff = compareRoutes(prev, curr);
    expect(diff.added).toContain('/contact');
    expect(diff.added).toContain('/faq');
    expect(diff.removed).toContain('/about');
    expect(diff.unchanged).toContain('/home');
  });
});

describe('formatDiff', () => {
  it('formats added and removed', () => {
    const result = formatDiff({ added: ['/new'], removed: ['/old'], unchanged: [] });
    expect(result).toContain('+ /new');
    expect(result).toContain('- /old');
  });

  it('returns no-change message when empty', () => {
    const result = formatDiff({ added: [], removed: [], unchanged: ['/x'] });
    expect(result).toBe('No changes detected.');
  });
});
