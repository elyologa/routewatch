import { RouteNode } from '../scanner/routeScanner';

export interface SymmetryPair {
  path: string;
  mirror: string;
  type: 'crud' | 'nested' | 'locale' | 'versioned';
}

export interface SymmetryReport {
  pairs: SymmetryPair[];
  asymmetric: string[];
  total: number;
}

function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function collectPaths(node: RouteNode, parent = ''): string[] {
  const current = buildPath(node, parent);
  const paths: string[] = [current];
  for (const child of node.children ?? []) {
    paths.push(...collectPaths(child, current));
  }
  return paths;
}

const CRUD_PAIRS: [string, string][] = [
  ['new', '[id]'],
  ['create', '[id]'],
];

function detectCrudPairs(paths: string[]): SymmetryPair[] {
  const pairs: SymmetryPair[] = [];
  for (const [a, b] of CRUD_PAIRS) {
    for (const path of paths) {
      if (path.endsWith(`/${a}`)) {
        const base = path.slice(0, path.length - a.length - 1);
        const mirror = `${base}/${b}`;
        if (paths.includes(mirror)) {
          pairs.push({ path, mirror, type: 'crud' });
        }
      }
    }
  }
  return pairs;
}

function detectVersionedPairs(paths: string[]): SymmetryPair[] {
  const versionRe = /\/v(\d+)\//;
  const pairs: SymmetryPair[] = [];
  const versioned = paths.filter(p => versionRe.test(p));
  for (const path of versioned) {
    const match = path.match(versionRe);
    if (!match) continue;
    const n = parseInt(match[1], 10);
    const mirror = path.replace(versionRe, `/v${n + 1}/`);
    if (paths.includes(mirror)) {
      pairs.push({ path, mirror, type: 'versioned' });
    }
  }
  return pairs;
}

export function detectSymmetry(root: RouteNode): SymmetryReport {
  const paths = collectPaths(root);
  const crudPairs = detectCrudPairs(paths);
  const versionedPairs = detectVersionedPairs(paths);
  const allPairs = [...crudPairs, ...versionedPairs];
  const paired = new Set(allPairs.flatMap(p => [p.path, p.mirror]));
  const asymmetric = paths.filter(p => !paired.has(p));
  return {
    pairs: allPairs,
    asymmetric,
    total: paths.length,
  };
}

export function formatSymmetryReport(report: SymmetryReport): string {
  const lines: string[] = ['Route Symmetry Report', '='.repeat(30)];
  if (report.pairs.length === 0) {
    lines.push('No symmetric route pairs detected.');
  } else {
    lines.push(`Symmetric pairs (${report.pairs.length}):`);
    for (const pair of report.pairs) {
      lines.push(`  [${pair.type}] ${pair.path}  <->  ${pair.mirror}`);
    }
  }
  lines.push(`\nAsymmetric routes: ${report.asymmetric.length}`);
  lines.push(`Total routes scanned: ${report.total}`);
  return lines.join('\n');
}
