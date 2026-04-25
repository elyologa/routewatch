import { describe, it, expect } from 'vitest';
import {
  detectRedirects,
  formatRedirectReport,
  matchesSource,
  collectPaths,
  RedirectRule,
} from './routeRedirect';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, hasPage: true, isDynamic: false, isCatchAll: false };
}

const tree = makeNode('root', [
  makeNode('about'),
  makeNode('blog', [
    makeNode('[slug]'),
  ]),
  makeNode('old-page'),
]);

describe('collectPaths', () => {
  it('collects all route paths', () => {
    const paths = collectPaths(tree);
    expect(paths).toContain('/about');
    expect(paths).toContain('/blog');
    expect(paths).toContain('/blog/[slug]');
    expect(paths).toContain('/old-page');
  });
});

describe('matchesSource', () => {
  it('matches exact paths', () => {
    expect(matchesSource('/about', '/about')).toBe(true);
    expect(matchesSource('/about', '/contact')).toBe(false);
  });

  it('matches wildcard patterns', () => {
    expect(matchesSource('/blog/hello', '/blog/*')).toBe(true);
    expect(matchesSource('/other/hello', '/blog/*')).toBe(false);
  });
});

describe('detectRedirects', () => {
  const rules: RedirectRule[] = [
    { source: '/old-page', destination: '/about', permanent: true },
    { source: '/blog/*', destination: '/posts/*', permanent: false },
  ];

  it('identifies affected routes', () => {
    const report = detectRedirects(tree, rules);
    expect(report.affectedRoutes).toContain('/old-page');
    expect(report.affectedRoutes).toContain('/blog/[slug]');
  });

  it('includes all rules in report', () => {
    const report = detectRedirects(tree, rules);
    expect(report.redirects).toHaveLength(2);
  });

  it('returns empty affected routes when no rules match', () => {
    const report = detectRedirects(tree, [{ source: '/nonexistent', destination: '/x', permanent: false }]);
    expect(report.affectedRoutes).toHaveLength(0);
  });
});

describe('formatRedirectReport', () => {
  it('formats report with redirects', () => {
    const rules: RedirectRule[] = [{ source: '/old-page', destination: '/about', permanent: true }];
    const report = detectRedirects(tree, rules);
    const output = formatRedirectReport(report);
    expect(output).toContain('[301]');
    expect(output).toContain('/old-page');
    expect(output).toContain('/about');
  });

  it('handles empty rules gracefully', () => {
    const report = detectRedirects(tree, []);
    const output = formatRedirectReport(report);
    expect(output).toContain('No redirect rules defined.');
  });
});
