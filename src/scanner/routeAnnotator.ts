import * as fs from 'fs';
import * as path from 'path';
import { RouteNode } from './routeScanner';

export interface RouteAnnotation {
  route: string;
  dynamic: boolean;
  catchAll: boolean;
  optional: boolean;
  group: boolean;
  parallel: boolean;
  intercepted: boolean;
  depth: number;
}

export function annotateSegment(segment: string): Omit<RouteAnnotation, 'route' | 'depth'> {
  return {
    dynamic: /^\[[^.]+\]$/.test(segment),
    catchAll: /^\[\.\.\..+\]$/.test(segment),
    optional: /^\[\[\.\.\..+\]\]$/.test(segment),
    group: /^\(.+\)$/.test(segment),
    parallel: segment.startsWith('@'),
    intercepted: segment.startsWith('(.)') || segment.startsWith('(..)'),
  };
}

export function annotateNode(
  node: RouteNode,
  parentPath = '',
  depth = 0
): RouteAnnotation[] {
  const results: RouteAnnotation[] = [];
  const current = parentPath ? `${parentPath}/${node.segment}` : node.segment || '/';

  if (node.isRoute) {
    results.push({
      route: current,
      depth,
      ...annotateSegment(node.segment),
    });
  }

  for (const child of node.children ?? []) {
    results.push(...annotateNode(child, current, depth + 1));
  }

  return results;
}

export function annotateRoutes(root: RouteNode): RouteAnnotation[] {
  return annotateNode(root, '', 0);
}
