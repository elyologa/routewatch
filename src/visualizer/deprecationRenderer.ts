import { DeprecatedRoute } from '../scanner/routeDeprecator';

export interface DeprecationSummary {
  total: number;
  withReason: number;
  routes: DeprecatedRoute[];
}

export function buildDeprecationSummary(routes: DeprecatedRoute[]): DeprecationSummary {
  return {
    total: routes.length,
    withReason: routes.filter(r => r.reason && r.reason !== 'Deprecated route').length,
    routes,
  };
}

export function renderDeprecationReport(summary: DeprecationSummary): string {
  const lines: string[] = [];
  lines.push(`Deprecated Routes: ${summary.total}`);
  lines.push(`With explicit reason: ${summary.withReason}`);
  if (summary.total === 0) {
    lines.push('  (none)');
    return lines.join('\n');
  }
  lines.push('');
  for (const r of summary.routes) {
    const since = r.since ? ` [since ${r.since}]` : '';
    lines.push(`  • ${r.path}${since}`);
    lines.push(`    Reason: ${r.reason}`);
  }
  return lines.join('\n');
}
