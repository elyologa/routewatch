import { RouteNode } from './routeScanner';

export interface ExportedRoute {
  path: string;
  depth: number;
  isDynamic: boolean;
  isCatchAll: boolean;
  hasPage: boolean;
  hasLayout: boolean;
}

function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function isDynamic(segment: string): boolean {
  return segment.startsWith('[') && !segment.startsWith('[...');
}

function isCatchAll(segment: string): boolean {
  return segment.startsWith('[...');
}

export function flattenToExported(
  node: RouteNode,
  parentPath = '',
  depth = 0
): ExportedRoute[] {
  const path = node.segment === '' ? '/' : buildPath(node, parentPath);
  const results: ExportedRoute[] = [];

  if (node.segment !== '') {
    results.push({
      path,
      depth,
      isDynamic: isDynamic(node.segment),
      isCatchAll: isCatchAll(node.segment),
      hasPage: node.hasPage ?? false,
      hasLayout: node.hasLayout ?? false,
    });
  }

  for (const child of node.children ?? []) {
    results.push(...flattenToExported(child, path === '/' ? '' : path, depth + 1));
  }

  return results;
}

export function exportRoutes(root: RouteNode): ExportedRoute[] {
  return flattenToExported(root);
}
