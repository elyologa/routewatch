import * as path from 'path';
import * as fs from 'fs';
import { RouteNode } from '../scanner/routeScanner';

export interface I18nRouteInfo {
  routePath: string;
  locales: string[];
  defaultLocale?: string;
  missingLocales: string[];
}

export interface I18nReport {
  routes: I18nRouteInfo[];
  allLocales: string[];
  fullyTranslated: number;
  partiallyTranslated: number;
}

export function buildPath(node: RouteNode, base = ''): string {
  return base ? `${base}/${node.segment}` : `/${node.segment}`;
}

export function detectRouteLocales(
  routePath: string,
  appDir: string,
  knownLocales: string[]
): string[] {
  const found: string[] = [];
  for (const locale of knownLocales) {
    const candidate = path.join(appDir, locale, routePath.replace(/^\//, ''));
    if (fs.existsSync(candidate)) {
      found.push(locale);
    }
  }
  return found;
}

export function walk(
  node: RouteNode,
  appDir: string,
  knownLocales: string[],
  defaultLocale: string,
  base = ''
): I18nRouteInfo[] {
  const current = buildPath(node, base);
  const results: I18nRouteInfo[] = [];

  const locales = detectRouteLocales(current, appDir, knownLocales);
  const missingLocales = knownLocales.filter((l) => !locales.includes(l));

  results.push({ routePath: current, locales, defaultLocale, missingLocales });

  for (const child of node.children ?? []) {
    results.push(...walk(child, appDir, knownLocales, defaultLocale, current));
  }

  return results;
}

export function collectI18nRoutes(
  root: RouteNode,
  appDir: string,
  knownLocales: string[],
  defaultLocale: string
): I18nReport {
  const routes = walk(root, appDir, knownLocales, defaultLocale);
  const fullyTranslated = routes.filter((r) => r.missingLocales.length === 0).length;
  const partiallyTranslated = routes.filter(
    (r) => r.missingLocales.length > 0 && r.locales.length > 0
  ).length;

  return {
    routes,
    allLocales: knownLocales,
    fullyTranslated,
    partiallyTranslated,
  };
}

export function formatI18nReport(report: I18nReport): string {
  const lines: string[] = [
    `I18n Coverage Report`,
    `Locales: ${report.allLocales.join(', ')}`,
    `Fully translated: ${report.fullyTranslated}`,
    `Partially translated: ${report.partiallyTranslated}`,
    '',
  ];

  for (const route of report.routes) {
    if (route.missingLocales.length > 0) {
      lines.push(`  ${route.routePath}  missing: [${route.missingLocales.join(', ')}]`);
    } else {
      lines.push(`  ${route.routePath}  ✓ all locales`);
    }
  }

  return lines.join('\n');
}
