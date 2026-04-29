import type { RouteNode } from '../scanner/routeScanner';

const BRANCH = '├── ';
const LAST   = '└── ';
const PIPE   = '│   ';
const SPACE  = '    ';

export interface RenderOptions {
  deadRoutes?: Set<string>;
  useColor?: boolean;
}

function label(node: RouteNode, dead: Set<string>, useColor: boolean): string {
  const isDead = dead.has(node.path);
  const tag = isDead ? ' [dead]' : '';
  const text = `${node.segment}${tag}`;
  if (!useColor) return text;
  if (isDead) return `\x1b[31m${text}\x1b[0m`;
  if (node.isPage) return `\x1b[32m${text}\x1b[0m`;
  return `\x1b[90m${text}\x1b[0m`;
}

function renderChildren(
  nodes: RouteNode[],
  prefix: string,
  dead: Set<string>,
  useColor: boolean,
  lines: string[]
): void {
  nodes.forEach((node, i) => {
    const isLast = i === nodes.length - 1;
    const connector = isLast ? LAST : BRANCH;
    lines.push(`${prefix}${connector}${label(node, dead, useColor)}`);
    const childPrefix = prefix + (isLast ? SPACE : PIPE);
    if (node.children.length > 0) {
      renderChildren(node.children, childPrefix, dead, useColor, lines);
    }
  });
}

export function renderTree(roots: RouteNode[], options: RenderOptions = {}): string {
  const dead = options.deadRoutes ?? new Set<string>();
  const useColor = options.useColor ?? true;
  const lines: string[] = ['app'];
  renderChildren(roots, '', dead, useColor, lines);
  return lines.join('\n');
}

/**
 * Returns a summary line describing the total number of routes and how many
 * are considered dead, e.g. "12 routes (3 dead)".
 */
export function renderSummary(roots: RouteNode[], options: RenderOptions = {}): string {
  const dead = options.deadRoutes ?? new Set<string>();
  const useColor = options.useColor ?? true;

  let total = 0;
  let deadCount = 0;

  function walk(nodes: RouteNode[]): void {
    for (const node of nodes) {
      if (node.isPage) {
        total++;
        if (dead.has(node.path)) deadCount++;
      }
      walk(node.children);
    }
  }

  walk(roots);

  const deadPart = deadCount > 0 ? ` (${deadCount} dead)` : '';
  const summary = `${total} route${total !== 1 ? 's' : ''}${deadPart}`;

  if (!useColor || deadCount === 0) return summary;
  return summary.replace(`${deadCount} dead`, `\x1b[31m${deadCount} dead\x1b[0m`);
}
