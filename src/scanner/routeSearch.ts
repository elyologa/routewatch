import { RouteNode } from './routeScanner';

export interface SearchOptions {
  caseSensitive?: boolean;
  matchSegment?: boolean;
}

export interface SearchResult {
  node: RouteNode;
  path: string;
  score: number;
}

function buildPath(node: RouteNode): string {
  return node.path;
}

function scoreMatch(query: string, target: string, opts: SearchOptions): number {
  const q = opts.caseSensitive ? query : query.toLowerCase();
  const t = opts.caseSensitive ? target : target.toLowerCase();
  if (t === q) return 2;
  if (t.includes(q)) return 1;
  return 0;
}

function walk(
  node: RouteNode,
  query: string,
  opts: SearchOptions,
  results: SearchResult[]
): void {
  const target = opts.matchSegment
    ? node.segment
    : buildPath(node);
  const score = scoreMatch(query, target, opts);
  if (score > 0) {
    results.push({ node, path: buildPath(node), score });
  }
  for (const child of node.children ?? []) {
    walk(child, query, opts, results);
  }
}

export function searchRoutes(
  root: RouteNode,
  query: string,
  opts: SearchOptions = {}
): SearchResult[] {
  const results: SearchResult[] = [];
  walk(root, query, opts, results);
  return results.sort((a, b) => b.score - a.score);
}
