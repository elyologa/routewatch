import { linkRoutes, formatLinks } from './routeLinker';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, path: segment };
}

describe('linkRoutes', () => {
  it('returns empty array for leaf node', () => {
    const node = makeNode('about');
    const links = linkRoutes(node);
    expect(links).toEqual([]);
  });

  it('creates child links for direct children', () => {
    const node = makeNode('app', [makeNode('dashboard'), makeNode('settings')]);
    const links = linkRoutes(node);
    const childLinks = links.filter(l => l.type === 'child');
    expect(childLinks).toHaveLength(2);
    expect(childLinks[0].to).toBe('/app/dashboard');
    expect(childLinks[1].to).toBe('/app/settings');
  });

  it('creates parent links for nested nodes', () => {
    const node = makeNode('app', [makeNode('dashboard')]);
    const links = linkRoutes(node);
    const parentLinks = links.filter(l => l.type === 'parent');
    expect(parentLinks).toHaveLength(1);
    expect(parentLinks[0].from).toBe('/app/dashboard');
    expect(parentLinks[0].to).toBe('/app');
  });

  it('creates sibling links between children', () => {
    const node = makeNode('app', [makeNode('a'), makeNode('b')]);
    const links = linkRoutes(node);
    const siblingLinks = links.filter(l => l.type === 'sibling');
    expect(siblingLinks.length).toBeGreaterThan(0);
  });
});

describe('formatLinks', () => {
  it('returns message when no links', () => {
    expect(formatLinks([])).toBe('No links found.');
  });

  it('formats links correctly', () => {
    const result = formatLinks([{ from: '/a', to: '/b', type: 'child' }]);
    expect(result).toBe('[CHILD] /a -> /b');
  });
});
