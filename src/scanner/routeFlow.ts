import { RouteNode } from '../scanner/routeScanner';

export interface FlowEdge {
  from: string;
  to: string;
  type: 'parent' | 'sibling' | 'dynamic';
}

export interface FlowGraph {
  nodes: string[];
  edges: FlowEdge[];
}

export interface FlowReport {
  graph: FlowGraph;
  entryPoints: string[];
  leafRoutes: string[];
  totalEdges: number;
}

export function buildPath(parent: string, segment: string): string {
  return parent === '/' ? `/${segment}` : `${parent}/${segment}`;
}

export function walk(
  node: RouteNode,
  parentPath: string,
  graph: FlowGraph
): void {
  const currentPath = node.segment === '' ? '/' : buildPath(parentPath, node.segment);

  if (!graph.nodes.includes(currentPath)) {
    graph.nodes.push(currentPath);
  }

  if (parentPath && parentPath !== currentPath) {
    graph.edges.push({ from: parentPath, to: currentPath, type: 'parent' });
  }

  const children = node.children ?? [];
  for (let i = 0; i < children.length; i++) {
    for (let j = i + 1; j < children.length; j++) {
      const a = buildPath(currentPath, children[i].segment);
      const b = buildPath(currentPath, children[j].segment);
      graph.edges.push({ from: a, to: b, type: 'sibling' });
    }
  }

  for (const child of children) {
    walk(child, currentPath, graph);
  }
}

export function analyzeFlow(root: RouteNode): FlowReport {
  const graph: FlowGraph = { nodes: [], edges: [] };
  walk(root, '', graph);

  const hasIncoming = new Set(graph.edges.map(e => e.to));
  const hasOutgoing = new Set(graph.edges.map(e => e.from));

  const entryPoints = graph.nodes.filter(n => !hasIncoming.has(n));
  const leafRoutes = graph.nodes.filter(n => !hasOutgoing.has(n));

  return {
    graph,
    entryPoints,
    leafRoutes,
    totalEdges: graph.edges.length,
  };
}

export function formatFlowReport(report: FlowReport): string {
  const lines: string[] = [];
  lines.push(`Route Flow Analysis`);
  lines.push(`${'='.repeat(40)}`);
  lines.push(`Total nodes : ${report.graph.nodes.length}`);
  lines.push(`Total edges : ${report.totalEdges}`);
  lines.push(`Entry points: ${report.entryPoints.length}`);
  lines.push(`Leaf routes : ${report.leafRoutes.length}`);
  lines.push('');
  if (report.entryPoints.length) {
    lines.push('Entry Points:');
    report.entryPoints.forEach(e => lines.push(`  ${e}`));
  }
  if (report.leafRoutes.length) {
    lines.push('Leaf Routes:');
    report.leafRoutes.forEach(l => lines.push(`  ${l}`));
  }
  return lines.join('\n');
}
