import { RouteNode } from '../scanner/routeScanner';

export interface SimilarPair {
  a: string;
  b: string;
  score: number;
  reason: string;
}

export interface SimilarityReport {
  pairs: SimilarPair[];
  total: number;
}

function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function collectPaths(node: RouteNode, parent = ''): string[] {
  const path = buildPath(node, parent);
  const paths: string[] = [path];
  for (const child of node.children ?? []) {
    paths.push(...collectPaths(child, path));
  }
  return paths;
}

function normalize(segment: string): string {
  return segment
    .replace(/\[\.\.\.[^\]]+\]/g, '[catchall]')
    .replace(/\[[^\]]+\]/g, '[param]');
}

export function computeSimilarity(a: string, b: string): number {
  const partsA = a.split('/').filter(Boolean).map(normalize);
  const partsB = b.split('/').filter(Boolean).map(normalize);
  if (partsA.length !== partsB.length) return 0;
  let matches = 0;
  for (let i = 0; i < partsA.length; i++) {
    if (partsA[i] === partsB[i]) matches++;
  }
  return matches / partsA.length;
}

export function detectSimilarRoutes(
  node: RouteNode,
  threshold = 0.8
): SimilarityReport {
  const paths = collectPaths(node);
  const pairs: SimilarPair[] = [];

  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      const score = computeSimilarity(paths[i], paths[j]);
      if (score >= threshold && score < 1) {
        pairs.push({
          a: paths[i],
          b: paths[j],
          score,
          reason: score === 1 ? 'identical structure' : 'near-duplicate segments',
        });
      }
    }
  }

  return { pairs, total: pairs.length };
}

export function formatSimilarityReport(report: SimilarityReport): string {
  if (report.total === 0) return 'No similar routes detected.\n';
  const lines: string[] = [`Similar Routes (${report.total} pairs):\n`];
  for (const p of report.pairs) {
    lines.push(
      `  ${p.a}  <->  ${p.b}  [score: ${(p.score * 100).toFixed(0)}%] — ${p.reason}`
    );
  }
  return lines.join('\n') + '\n';
}
