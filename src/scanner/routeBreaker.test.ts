import { describe, it, expect } from 'vitest';
import {
  detectBrokenRoutes,
  formatBreakerReport,
  BreakerRule,
} from './routeBreaker';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  children: RouteNode[] = []
): RouteNode {
  return { segment, children, hasPage: children.length === 0 };
}

const rules: BreakerRule[] = [
  { pattern: '^\\d+$', reason: 'Segment is purely numeric' },
  { pattern: '__', reason: 'Segment contains double underscore' },
];

describe('detectBrokenRoutes', () => {
  it('returns empty broken list when no rules match', () => {
    const root = makeNode('', [makeNode('about'), makeNode('contact')]);
    const report = detectBrokenRoutes(root, rules);
    expect(report.brokenCount).toBe(0);
    expect(report.broken).toHaveLength(0);
  });

  it('detects a numeric segment', () => {
    const root = makeNode('', [makeNode('123')]);
    const report = detectBrokenRoutes(root, rules);
    expect(report.brokenCount).toBe(1);
    expect(report.broken[0].segment).toBe('123');
    expect(report.broken[0].issues).toContain('Segment is purely numeric');
  });

  it('detects a double-underscore segment', () => {
    const root = makeNode('', [makeNode('bad__route')]);
    const report = detectBrokenRoutes(root, rules);
    expect(report.brokenCount).toBe(1);
    expect(report.broken[0].issues).toContain('Segment contains double underscore');
  });

  it('accumulates multiple issues on a single segment', () => {
    const root = makeNode('', [makeNode('123__x')]);
    const report = detectBrokenRoutes(root, [rules[1], { pattern: '123', reason: 'Contains 123' }]);
    expect(report.broken[0].issues).toHaveLength(2);
  });

  it('builds correct path for nested segments', () => {
    const root = makeNode('', [makeNode('api', [makeNode('123')])]);
    const report = detectBrokenRoutes(root, rules);
    expect(report.broken[0].path).toBe('/api/123');
  });
});

describe('formatBreakerReport', () => {
  it('returns success message when no broken routes', () => {
    const report = { broken: [], total: 1, brokenCount: 0 };
    expect(formatBreakerReport(report)).toContain('No broken route patterns detected');
  });

  it('includes broken route path and issue in output', () => {
    const report = {
      broken: [{ path: '/api/123', segment: '123', issues: ['Segment is purely numeric'] }],
      total: 1,
      brokenCount: 1,
    };
    const out = formatBreakerReport(report);
    expect(out).toContain('/api/123');
    expect(out).toContain('Segment is purely numeric');
  });
});
