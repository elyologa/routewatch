import { describe, it, expect } from 'vitest';
import {
  buildSimilaritySummary,
  renderSimilarityReport,
} from './similarityRenderer';
import { SimilarityReport } from '../scanner/routeSimilarity';

function makeReport(overrides: Partial<SimilarityReport> = {}): SimilarityReport {
  return {
    pairs: [],
    total: 0,
    ...overrides,
  };
}

describe('buildSimilaritySummary', () => {
  it('counts buckets correctly', () => {
    const report = makeReport({
      total: 3,
      pairs: [
        { a: '/a', b: '/b', score: 0.97, reason: 'test' },
        { a: '/c', b: '/d', score: 0.88, reason: 'test' },
        { a: '/e', b: '/f', score: 0.81, reason: 'test' },
      ],
    });
    const summary = buildSimilaritySummary(report);
    expect(summary.high).toBe(1);
    expect(summary.medium).toBe(1);
    expect(summary.low).toBe(1);
  });

  it('returns zero counts for empty report', () => {
    const summary = buildSimilaritySummary(makeReport());
    expect(summary.high).toBe(0);
    expect(summary.medium).toBe(0);
    expect(summary.low).toBe(0);
  });
});

describe('renderSimilarityReport', () => {
  it('shows no-similar message for empty report', () => {
    const out = renderSimilarityReport(makeReport());
    expect(out).toContain('No similar routes detected');
  });

  it('renders pair details', () => {
    const report = makeReport({
      total: 1,
      pairs: [{ a: '/users/[id]', b: '/posts/[id]', score: 0.9, reason: 'near-duplicate segments' }],
    });
    const out = renderSimilarityReport(report);
    expect(out).toContain('/users/[id]');
    expect(out).toContain('/posts/[id]');
    expect(out).toContain('near-duplicate segments');
  });

  it('includes summary counts', () => {
    const report = makeReport({
      total: 1,
      pairs: [{ a: '/a', b: '/b', score: 0.97, reason: 'x' }],
    });
    const out = renderSimilarityReport(report);
    expect(out).toContain('High similarity');
  });
});
