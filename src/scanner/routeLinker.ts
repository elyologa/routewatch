import { RouteNode } from '../scanner/routeScanner';

export interface RouteLink {
  from: string;
  to: string;
  type: 'parent' | 'sibling' | 'child';
}

function buildPath(node: RouteNode, prefix = ''): string {
  return prefix ? `${prefix}/${node.segment}` : `/${node.segment}`;
}

function collectLinks(
  node: RouteNode,
  parentPath: string | null,
  siblings: RouteNode[],
  links: RouteLink[],
  currentPath: string
): void {
  if (parentPath) {
    links.push({ from: currentPath, to: parentPath, type: 'parent' });
  }

  for (const sibling of siblings) {
    const siblingPath = buildPath(sibling, parentPath ?? '');
    if (siblingPath !== currentPath) {
      links.push({ from: currentPath, to: siblingPath, type: 'sibling' });
    }
  }

  for (const child of node.children ?? []) {
    const childPath = buildPath(child, currentPath);
    links.push({ from: currentPath, to: childPath, type: 'child' });
    collectLinks(child, currentPath, node.children ?? [], links, childPath);
  }
}

export function linkRoutes(root: RouteNode): RouteLink[] {
  const links: RouteLink[] = [];
  const rootPath = `/${root.segment}`;
  collectLinks(root, null, [], links, rootPath);
  return links;
}

export function formatLinks(links: RouteLink[]): string {
  if (links.length === 0) return 'No links found.';
  return links
    .map(l => `[${l.type.toUpperCase()}] ${l.from} -> ${l.to}`)
    .join('\n');
}
