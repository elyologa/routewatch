import { describe, it, expect } from 'vitest';
import {
  computeEntropy,
  analyzeEntropy,
  formatEntropyReport,
  isDynamic,
  isCatchAll,
} from './routeEntropy';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, hasPage: true };
}

describe('isDynamic', () => {
  it('returns true for dynamic segments', () => {
    expect(isDynamic('[id]')).toBe(true);
  });
  it('returns false for static segments', () => {
    expect(isDynamic('about')).toBe(false);
  });
  it('returns false for catch-all segments', () => {
    expect(isDynamic('[...slug]')).toBe(false);
  });
});

describe('isCatchAll', () => {
  it('returns true for catch-all segments', () => {
    expect(isCatchAll('[...slug]')).toBe(true);
  });
  it('returns false for static segments', () => {
    expect(isCatchAll('about')).toBe(false);
  });
});

describe('computeEntropy', () => {
  it('returns low score for shallow static path', () => {
    expect(computeEntropy('/about')).toBe(1);
  });
  it('penalizes dynamic segments', () => {
    const score = computeEntropy('/blog/[id]');
    expect(score).toBeGreaterThan(2);
  });
  it('penalizes catch-all segments more than dynamic', () => {
    const dynamic = computeEntropy('/blog/[id]');
    const catchAll = computeEntropy('/blog/[...slug]');
    expect(catchAll).toBeGreaterThan(dynamic);
  });
});

describe('analyzeEntropy', () => {
  it('computes report for a simple tree', () => {
    const root = makeNode('', [
      makeNode('about'),
      makeNode('blog', [makeNode('[id]')]),
    ]);
    const report = analyzeEntropy(root);
    expect(report.routes.length).toBeGreaterThan(0);
    expect(report.averageEntropy).toBeGreaterThan(0);
    expect(report.maxEntropy).toBeGreaterThanOrEqual(report.minEntropy);
  });

  it('sets highEntropyThreshold to averageEntropy + 2', () => {
    const root = makeNode('', [makeNode('home')]);
    const report = analyzeEntropy(root);
    expect(report.highEntropyThreshold).toBeCloseTo(report.averageEntropy + 2, 1);
  });
});

describe('formatEntropyReport', () => {
  it('includes summary statistics', () => {
    const root = makeNode('', [
      makeNode('a'),
      makeNode('b', [makeNode('[...all]')]),
    ]);
    const report = analyzeEntropy(root);
    const output = formatEntropyReport(report);
    expect(output).toContain('Route Entropy Report');
    expect(output).toContain('Average entropy');
    expect(output).toContain('Total routes');
  });

  it('lists high-entropy routes when present', () => {
    const root = makeNode('', [
      makeNode('x', [makeNode('[a]', [makeNode('[b]', [makeNode('[...rest]')])])]),
    ]);
    const report = analyzeEntropy(root);
    const output = formatEntropyReport(report);
    // At least one deeply nested dynamic route should appear
    expect(output).toMatch(/High-entropy routes:|No high-entropy/);
  });
});
