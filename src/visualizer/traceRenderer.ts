import { TraceReport, TraceEntry } from '../scanner/routeTracer';

const COLORS = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  bold: '\x1b[1m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function renderEntry(entry: TraceEntry, isLast: boolean, prefix: string): string {
  const connector = isLast ? '└── ' : '├── ';
  const segment = entry.route.split('/').filter(Boolean).pop() ?? '/';

  let label = colorize(segment || '/', 'cyan');
  if (entry.isDynamic) label += colorize(' ⬡ dynamic', 'yellow');
  if (entry.isCatchAll) label += colorize(' ⬡ catch-all', 'magenta');
  if (entry.isLeaf) label += colorize(' •', 'green');

  return `${prefix}${connector}${label}`;
}

export function buildTraceSummary(report: TraceReport): string {
  const lines = [
    colorize(`Routes: ${report.totalRoutes}`, 'bold' as any),
    `Max depth : ${report.maxDepth}`,
    `Leaf nodes: ${report.leafCount}`,
    `Dynamic   : ${report.entries.filter(e => e.isDynamic).length}`,
    `Catch-all : ${report.entries.filter(e => e.isCatchAll).length}`,
  ];
  return lines.join('  |  ');
}

export function renderTraceTree(report: TraceReport): string {
  if (report.entries.length === 0) return '(empty)';

  // Group entries by depth for tree rendering
  const lines: string[] = [colorize('/', 'bold' as any)];

  const topLevel = report.entries.filter(e => e.depth === 1);
  topLevel.forEach((entry, idx) => {
    const isLast = idx === topLevel.length - 1;
    lines.push(renderEntry(entry, isLast, ''));

    const children = report.entries.filter(e => e.parent === entry.route);
    children.forEach((child, cidx) => {
      const childLast = cidx === children.length - 1;
      const childPrefix = isLast ? '    ' : '│   ';
      lines.push(renderEntry(child, childLast, childPrefix));
    });
  });

  return lines.join('\n');
}

export function renderTraceReport(report: TraceReport): string {
  const sections: string[] = [
    colorize('Route Trace', 'bold' as any),
    '─'.repeat(40),
    renderTraceTree(report),
    '',
    buildTraceSummary(report),
  ];
  return sections.join('\n');
}
