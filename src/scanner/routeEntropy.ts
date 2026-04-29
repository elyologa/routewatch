import { RouteNode } from '../scanner/routeScanner';

export interface EntropyResult {
  path: string;
  depth: number;
  segmentCount: number;
  dynamicCount: number;
  catchAllCount: number;
  entropyScore: number;
}

export interface EntropyReport {
  routes: EntropyResult[];
  averageEntropy: number;
  maxEntropy: number;
  minEntropy: number;
  highEntropyThreshold: number;
}

export function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

export function isDynamic(segment: string): boolean {
  return segment.startsWith('[') && !segment.startsWith('[...');
}

export function isCatchAll(segment: string): boolean {
  return segment.startsWith('[...');
}

export function computeEntropy(path: string): number {
  const segments = path.split('/').filter(Boolean);
  const depth = segments.length;
  const dynamicCount = segments.filter(isDynamic).length;
  const catchAllCount = segments.filter(isCatchAll).length;
  // Shannon-inspired entropy: penalize dynamic and catch-all segments
  const dynamicWeight = 1.5;
  const catchAllWeight = 2.5;
  const baseScore = depth;
  return parseFloat(
    (baseScore + dynamicCount * dynamicWeight + catchAllCount * catchAllWeight).toFixed(2)
  );
}

export function walk(
  node: RouteNode,
  results: EntropyResult[],
  parentPath = ''
): void {
  const path = buildPath(node, parentPath);
  const segments = path.split('/').filter(Boolean);
  const dynamicCount = segments.filter(isDynamic).length;
  const catchAllCount = segments.filter(isCatchAll).length;
  results.push({
    path,
    depth: segments.length,
    segmentCount: segments.length,
    dynamicCount,
    catchAllCount,
    entropyScore: computeEntropy(path),
  });
  for (const child of node.children ?? []) {
    walk(child, results, path);
  }
}

export function analyzeEntropy(root: RouteNode): EntropyReport {
  const results: EntropyResult[] = [];
  walk(root, results);
  const scores = results.map(r => r.entropyScore);
  const averageEntropy = scores.length
    ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
    : 0;
  const maxEntropy = scores.length ? Math.max(...scores) : 0;
  const minEntropy = scores.length ? Math.min(...scores) : 0;
  const highEntropyThreshold = parseFloat((averageEntropy + 2).toFixed(2));
  return { routes: results, averageEntropy, maxEntropy, minEntropy, highEntropyThreshold };
}

export function formatEntropyReport(report: EntropyReport): string {
  const lines: string[] = ['Route Entropy Report', '='.repeat(40)];
  const high = report.routes.filter(r => r.entropyScore >= report.highEntropyThreshold);
  lines.push(`Total routes: ${report.routes.length}`);
  lines.push(`Average entropy: ${report.averageEntropy}`);
  lines.push(`Max entropy: ${report.maxEntropy}  Min entropy: ${report.minEntropy}`);
  lines.push(`High-entropy threshold: ${report.highEntropyThreshold}`);
  lines.push('');
  if (high.length > 0) {
    lines.push('High-entropy routes:');
    for (const r of high) {
      lines.push(`  ${r.path}  (score: ${r.entropyScore}, dynamic: ${r.dynamicCount}, catch-all: ${r.catchAllCount})`);
    }
  } else {
    lines.push('No high-entropy routes detected.');
  }
  return lines.join('\n');
}
