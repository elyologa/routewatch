import { describe, it, expect } from 'vitest';
import {
  computeSimilarity,
  detectSimilarRoutes,
  formatSimilarityReport,
} from './routeSimilarity';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  children: RouteNode[] = []
): RouteNode {
  return { segment, children, path: `/${segment}` };
}

describe('computeSimilarity', () => {
  it('returns 1 for identical normalized paths', () => {
    expect(computeSimilarity('/users/[id]', '/posts/[id]')).toBe(0.5);
  });

  it('returns 0 for different depth paths', () => {
    expect(computeSimilarity('/a', '/a/b')).toBe(0);
  });

  it('normalizes dynamic segments', () => {
    expect(computeSimilarity('/users/[id]/edit', '/posts/[slug]/edit')).toBeCloseTo(0.667, 2);
  });

  it('returns 1 for structurally identical paths', () => {
    expect(computeSimilarity('/a/[param]/b', '/a/[other]/b')).toBe(1);
  });
});

describe('detectSimilarRoutes', () => {
  it('finds near-duplicate routes', () => {
    const root = makeNode('', [
      makeNode('users', [
        makeNode('[id]', [makeNode('edit')]),
      ]),
      makeNode('posts', [
        makeNode('[id]', [makeNode('edit')]),
      ]),
    ]);
    const report = detectSimilarRoutes(root, 0.8);
    expect(report.total).toBeGreaterThan(0);
  });

  it('returns empty when no similar routes exist', () => {
    const root = makeNode('', [
      makeNode('about'),
      makeNode('contact'),
    ]);
    const report = detectSimilarRoutes(root, 0.8);
    expect(report.total).toBe(0);
  });
});

describe('formatSimilarityReport', () => {
  it('returns no-similar message when empty', () => {
    const out = formatSimilarityReport({ pairs: [], total: 0 });
    expect(out).toContain('No similar routes');
  });

  it('lists pairs when present', () => {
    const out = formatSimilarityReport({
      pairs: [{ a: '/users/[id]', b: '/posts/[id]', score: 0.5, reason: 'near-duplicate segments' }],
      total: 1,
    });
    expect(out).toContain('/users/[id]');
    expect(out).toContain('/posts/[id]');
  });
});
