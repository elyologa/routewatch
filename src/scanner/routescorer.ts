import { RouteNode } from './routeScanner';

export interface ScoredRoute {
  path: string;
  score: number;
  reasons: string[];
}

function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function scoreNode(node: RouteNode, path: string): ScoredRoute {
  const reasons: string[] = [];
  let score = 0;

  if (node.isDynamic) {
    score += 10;
    reasons.push('dynamic segment (+10)');
  }

  if (node.isCatchAll) {
    score += 20;
    reasons.push('catch-all segment (+20)');
  }

  if (node.hasPage) {
    score += 5;
    reasons.push('has page (+5)');
  }

  if (node.hasLayout) {
    score += 3;
    reasons.push('has layout (+3)');
  }

  if (node.hasLoading) {
    score += 2;
    reasons.push('has loading (+2)');
  }

  if (node.hasError) {
    score += 2;
    reasons.push('has error (+2)');
  }

  const depth = path.split('/').filter(Boolean).length;
  score += depth;
  reasons.push(`depth ${depth} (+${depth})`);

  return { path, score, reasons };
}

function walk(node: RouteNode, parent = '', results: ScoredRoute[] = []): ScoredRoute[] {
  const path = buildPath(node, parent);
  results.push(scoreNode(node, path));
  for (const child of node.children ?? []) {
    walk(child, path, results);
  }
  return results;
}

export function scoreRoutes(root: RouteNode): ScoredRoute[] {
  const results: ScoredRoute[] = [];
  for (const child of root.children ?? []) {
    walk(child, '', results);
  }
  return results.sort((a, b) => b.score - a.score);
}

export function formatScores(scored: ScoredRoute[]): string {
  if (scored.length === 0) return 'No routes to score.';
  return scored
    .map(r => `${r.path} — score: ${r.score}\n  ${r.reasons.join(', ')}`)
    .join('\n');
}
