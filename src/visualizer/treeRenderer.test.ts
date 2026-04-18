import { renderTree } from './treeRenderer';
import type { RouteNode } from '../scanner/routeScanner';

function makeNode(
  segment: string,
  path: string,
  isPage: boolean,
  children: RouteNode[] = []
): RouteNode {
  return { segment, path, isPage, isDynamic: segment.startsWith('['), children };
}

describe('renderTree', () => {
  it('renders a single root node', () => {
    const nodes = [makeNode('about', '/about', true)];
    const out = renderTree(nodes, { useColor: false });
    expect(out).toContain('app');
    expect(out).toContain('about');
  });

  it('renders nested children', () => {
    const child = makeNode('settings', '/dashboard/settings', true);
    const nodes = [makeNode('dashboard', '/dashboard', false, [child])];
    const out = renderTree(nodes, { useColor: false });
    expect(out).toContain('dashboard');
    expect(out).toContain('settings');
  });

  it('marks dead routes with [dead] tag', () => {
    const nodes = [makeNode('old', '/old', true)];
    const dead = new Set(['/old']);
    const out = renderTree(nodes, { useColor: false, deadRoutes: dead });
    expect(out).toContain('[dead]');
  });

  it('does not mark live routes as dead', () => {
    const nodes = [makeNode('home', '/', true)];
    const out = renderTree(nodes, { useColor: false, deadRoutes: new Set() });
    expect(out).not.toContain('[dead]');
  });

  it('uses ANSI codes when useColor is true', () => {
    const nodes = [makeNode('about', '/about', true)];
    const out = renderTree(nodes, { useColor: true });
    expect(out).toContain('\x1b[');
  });
});
