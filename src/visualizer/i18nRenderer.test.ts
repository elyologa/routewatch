import { describe, it, expect } from 'vitest';
import { buildI18nSummary, renderI18nRoute, renderI18nReport } from './i18nRenderer';
import { I18nReport, I18nRouteInfo } from '../scanner/routeI18n';

function makeReport(overrides: Partial<I18nReport> = {}): I18nReport {
  return {
    routes: [],
    allLocales: ['en', 'fr'],
    fullyTranslated: 0,
    partiallyTranslated: 0,
    ...overrides,
  };
}

function makeRouteInfo(overrides: Partial<I18nRouteInfo> = {}): I18nRouteInfo {
  return {
    routePath: '/about',
    locales: ['en'],
    defaultLocale: 'en',
    missingLocales: [],
    ...overrides,
  };
}

describe('buildI18nSummary', () => {
  it('includes locale list', () => {
    const summary = buildI18nSummary(makeReport());
    expect(summary).toContain('en, fr');
  });

  it('shows 100% when no routes', () => {
    const summary = buildI18nSummary(makeReport());
    expect(summary).toContain('100%');
  });

  it('calculates partial coverage', () => {
    const report = makeReport({
      routes: [makeRouteInfo(), makeRouteInfo()],
      fullyTranslated: 1,
    });
    const summary = buildI18nSummary(report);
    expect(summary).toContain('50%');
  });
});

describe('renderI18nRoute', () => {
  it('marks fully translated route with checkmark', () => {
    const output = renderI18nRoute(makeRouteInfo());
    expect(output).toContain('✓');
    expect(output).toContain('/about');
  });

  it('marks missing locale route with cross', () => {
    const output = renderI18nRoute(makeRouteInfo({ missingLocales: ['fr'] }));
    expect(output).toContain('✗');
    expect(output).toContain('fr');
  });
});

describe('renderI18nReport', () => {
  it('renders incomplete and complete sections', () => {
    const routes = [
      makeRouteInfo({ routePath: '/home', missingLocales: [] }),
      makeRouteInfo({ routePath: '/contact', missingLocales: ['fr'] }),
    ];
    const report = makeReport({ routes, fullyTranslated: 1, partiallyTranslated: 1 });
    const output = renderI18nReport(report);
    expect(output).toContain('Incomplete translations');
    expect(output).toContain('Fully translated routes');
    expect(output).toContain('/home');
    expect(output).toContain('/contact');
  });
});
