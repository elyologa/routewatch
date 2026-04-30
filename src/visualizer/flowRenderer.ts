import { FlowReport, FlowEdge } from '../scanner/routeFlow';

const COLORS = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

function colorize(text: string, color: keyof typeof COLORS): string {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

function edgeSymbol(type: FlowEdge['type']): string {
  switch (type) {
    case 'parent': return '→';
    case 'sibling': return '↔';
    case 'dynamic': return '⇢';
    default: return '-';
  }
}

export function renderFlowEdges(edges: FlowEdge[], limit = 20): string {
  const lines: string[] = [colorize('Flow Edges:', 'bold')];
  const shown = edges.slice(0, limit);
  for (const edge of shown) {
    const sym = edgeSymbol(edge.type);
    const color: keyof typeof COLORS = edge.type === 'parent' ? 'cyan' : edge.type === 'sibling' ? 'yellow' : 'green';
    lines.push(`  ${colorize(edge.from, 'gray')} ${colorize(sym, color)} ${colorize(edge.to, 'gray')}`);
  }
  if (edges.length > limit) {
    lines.push(colorize(`  ... and ${edges.length - limit} more edges`, 'gray'));
  }
  return lines.join('\n');
}

export function buildFlowSummary(report: FlowReport): string {
  const lines: string[] = [];
  lines.push(colorize('Route Flow Summary', 'bold'));
  lines.push(colorize('─'.repeat(36), 'gray'));
  lines.push(`  Nodes       : ${colorize(String(report.graph.nodes.length), 'cyan')}`);
  lines.push(`  Edges       : ${colorize(String(report.totalEdges), 'yellow')}`);
  lines.push(`  Entry points: ${colorize(String(report.entryPoints.length), 'green')}`);
  lines.push(`  Leaf routes : ${colorize(String(report.leafRoutes.length), 'green')}`);
  return lines.join('\n');
}

export function renderFlowReport(report: FlowReport): string {
  const parts: string[] = [];
  parts.push(buildFlowSummary(report));
  parts.push('');
  if (report.entryPoints.length) {
    parts.push(colorize('Entry Points:', 'bold'));
    report.entryPoints.forEach(e => parts.push(`  ${colorize(e, 'cyan')}}`));
    parts.push('');
  }
  if (report.leafRoutes.length) {
    parts.push(colorize('Leaf Routes:', 'bold'));
    report.leafRoutes.forEach(l => parts.push(`  ${colorize(l, 'green')}`));
    parts.push('');
  }
  parts.push(renderFlowEdges(report.graph.edges));
  return parts.join('\n');
}
