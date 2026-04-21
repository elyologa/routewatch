import { RouteNode } from '../scanner/routeScanner';

export interface LocaleRoute {
  path: string;
  locale: string;
  isDefault: boolean;
}

export interface LocaleReport {
  locales: string[];
  routes: LocaleRoute[];
  missingLocales: Record<string, string[]>;
}

function buildPath(node: RouteNode, prefix = ''): string {
  return prefix ? `${prefix}/${node.segment}` : `/${node.segment}`;
}

const LOCALE_PATTERN = /^\[?([a-z]{2}(?:-[A-Z]{2})?)\]?$/;

export function isLocaleSegment(segment: string): boolean {
  const clean = segment.replace(/^\(|\)$/g, '').replace(/^\[|\]$/g, '');
  return LOCALE_PATTERN.test(clean);
}

export function detectLocales(nodes: RouteNode[]): string[] {
  const found = new Set<string>();
  for (const node of nodes) {
    if (isLocaleSegment(node.segment)) {
      const clean = node.segment.replace(/^\[|\]$/g, '');
      found.add(clean);
    }
  }
  return Array.from(found).sort();
}

export function walk(
  node: RouteNode,
  locales: string[],
  prefix: string,
  results: LocaleRoute[]
): void {
  const path = buildPath(node, prefix);
  if (isLocaleSegment(node.segment)) {
    const locale = node.segment.replace(/^\[|\]$/g, '');
    results.push({ path, locale, isDefault: false });
  }
  for (const child of node.children ?? []) {
    walk(child, locales, path, results);
  }
}

export function collectLocaleRoutes(
  nodes: RouteNode[],
  defaultLocale = 'en'
): LocaleReport {
  const locales = detectLocales(nodes);
  const routes: LocaleRoute[] = [];

  for (const node of nodes) {
    walk(node, locales, '', routes);
  }

  // Mark default locale routes
  for (const r of routes) {
    if (r.locale === defaultLocale) r.isDefault = true;
  }

  // Find paths missing some locales
  const byPath: Record<string, string[]> = {};
  for (const r of routes) {
    const base = r.path.replace(`/${r.locale}`, '');
    if (!byPath[base]) byPath[base] = [];
    byPath[base].push(r.locale);
  }

  const missingLocales: Record<string, string[]> = {};
  for (const [base, present] of Object.entries(byPath)) {
    const missing = locales.filter(l => !present.includes(l));
    if (missing.length > 0) missingLocales[base] = missing;
  }

  return { locales, routes, missingLocales };
}

export function formatLocaleReport(report: LocaleReport): string {
  const lines: string[] = [];
  lines.push(`Locales detected: ${report.locales.join(', ') || 'none'}`);
  lines.push(`Total locale routes: ${report.routes.length}`);
  const missing = Object.entries(report.missingLocales);
  if (missing.length > 0) {
    lines.push('\nRoutes missing locales:');
    for (const [path, locales] of missing) {
      lines.push(`  ${path || '/'} — missing: ${locales.join(', ')}`);
    }
  } else {
    lines.push('All routes are fully localized.');
  }
  return lines.join('\n');
}
