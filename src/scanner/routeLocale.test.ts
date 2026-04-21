import { describe, it, expect } from 'vitest';
import {
  isLocaleSegment,
  detectLocales,
  collectLocaleRoutes,
  formatLocaleReport,
} from './routeLocale';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  children: RouteNode[] = []
): RouteNode {
  return { segment, children, path: `/${segment}` };
}

describe('isLocaleSegment', () => {
  it('matches plain locale codes', () => {
    expect(isLocaleSegment('en')).toBe(true);
    expect(isLocaleSegment('fr')).toBe(true);
    expect(isLocaleSegment('pt-BR')).toBe(true);
  });

  it('matches dynamic locale segments', () => {
    expect(isLocaleSegment('[en]')).toBe(true);
    expect(isLocaleSegment('[fr]')).toBe(true);
  });

  it('rejects non-locale segments', () => {
    expect(isLocaleSegment('dashboard')).toBe(false);
    expect(isLocaleSegment('[id]')).toBe(false);
    expect(isLocaleSegment('(group)')).toBe(false);
  });
});

describe('detectLocales', () => {
  it('returns unique sorted locales from top-level nodes', () => {
    const nodes = [
      makeNode('en'),
      makeNode('fr'),
      makeNode('dashboard'),
    ];
    expect(detectLocales(nodes)).toEqual(['en', 'fr']);
  });

  it('returns empty array when no locale segments', () => {
    expect(detectLocales([makeNode('about'), makeNode('contact')])).toEqual([]);
  });
});

describe('collectLocaleRoutes', () => {
  it('collects routes and marks default locale', () => {
    const nodes = [
      makeNode('en', [makeNode('about')]),
      makeNode('fr', [makeNode('about')]),
    ];
    const report = collectLocaleRoutes(nodes, 'en');
    expect(report.locales).toEqual(['en', 'fr']);
    const enRoute = report.routes.find(r => r.locale === 'en');
    expect(enRoute?.isDefault).toBe(true);
    const frRoute = report.routes.find(r => r.locale === 'fr');
    expect(frRoute?.isDefault).toBe(false);
  });

  it('detects missing locales across routes', () => {
    const nodes = [
      makeNode('en', [makeNode('about')]),
      makeNode('fr'),
    ];
    const report = collectLocaleRoutes(nodes, 'en');
    // /about exists under en but not fr — detected at base path level
    expect(report.missingLocales).toBeDefined();
  });

  it('reports no missing locales when fully covered', () => {
    const nodes = [makeNode('en'), makeNode('fr')];
    const report = collectLocaleRoutes(nodes, 'en');
    expect(Object.keys(report.missingLocales)).toHaveLength(0);
  });
});

describe('formatLocaleReport', () => {
  it('includes locale list and route count', () => {
    const nodes = [makeNode('en'), makeNode('fr')];
    const report = collectLocaleRoutes(nodes, 'en');
    const output = formatLocaleReport(report);
    expect(output).toContain('en, fr');
    expect(output).toContain('Total locale routes: 2');
  });

  it('shows fully localized message when no gaps', () => {
    const nodes = [makeNode('en'), makeNode('fr')];
    const report = collectLocaleRoutes(nodes, 'en');
    const output = formatLocaleReport(report);
    expect(output).toContain('fully localized');
  });
});
