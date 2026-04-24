import { describe, it, expect } from 'vitest';
import type { RouteNode } from './routeScanner';
import { computeHeatmap, formatHeatmapReport } from './routeHeatmap';

function makeNode(
  segment: string,
  children: RouteNode[] = [],
  hasPage = true
): RouteNode {
  return { segment, children, hasPage, isDynamic: segment.startsWith('['), isCatchAll: segment.startsWith('[...') };
}

describe('computeHeatmap', () => {
  it('returns empty array for empty tree', () => {
    const node = makeNode('app', [], false);
    const result = computeHeatmap(node);
    expect(result).toEqual([]);
  });

  it('scores a simple page node', () => {
    const node = makeNode('app', [makeNode('about')], false);
    const result = computeHeatmap(node);
    expect(result).toHaveLength(1);
    expect(result[0].path).toBe('/about');
    expect(result[0].score).toBeGreaterThan(0);
  });

  it('assigns higher score to dynamic routes', () => {
    const staticNode = makeNode('app', [makeNode('contact')], false);
    const dynamicNode = makeNode('app', [makeNode('[id]')], false);
    const staticResult = computeHeatmap(staticNode);
    const dynamicResult = computeHeatmap(dynamicNode);
    expect(dynamicResult[0].score).toBeGreaterThan(staticResult[0].score);
  });

  it('assigns higher score to deeply nested routes', () => {
    const shallow = makeNode('app', [makeNode('a')], false);
    const deep = makeNode('app', [
      makeNode('a', [makeNode('b', [makeNode('c')])], false)
    ], false);
    const shallowResult = computeHeatmap(shallow);
    const deepResult = computeHeatmap(deep);
    expect(deepResult[deepResult.length - 1].score).toBeGreaterThan(shallowResult[0].score);
  });

  it('assigns catch-all routes the highest base score', () => {
    const catchAll = makeNode('app', [makeNode('[...slug]')], false);
    const result = computeHeatmap(catchAll);
    expect(result[0].score).toBeGreaterThanOrEqual(3);
  });
});

describe('formatHeatmapReport', () => {
  it('returns a non-empty string for valid heatmap entries', () => {
    const node = makeNode('app', [makeNode('home'), makeNode('[id]')], false);
    const heatmap = computeHeatmap(node);
    const report = formatHeatmapReport(heatmap);
    expect(typeof report).toBe('string');
    expect(report.length).toBeGreaterThan(0);
  });

  it('includes route paths in the report', () => {
    const node = makeNode('app', [makeNode('dashboard')], false);
    const heatmap = computeHeatmap(node);
    const report = formatHeatmapReport(heatmap);
    expect(report).toContain('/dashboard');
  });

  it('returns a message when no routes found', () => {
    const report = formatHeatmapReport([]);
    expect(report).toContain('No routes');
  });
});
