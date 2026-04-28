import {
  renderTraceReport,
  renderTraceTree,
  buildTraceSummary,
} from './traceRenderer';
import { TraceReport, TraceEntry } from '../scanner/routeTracer';

function makeEntry(overrides: Partial<TraceEntry> = {}): TraceEntry {
  return {
    route: '/about',
    depth: 1,
    parent: '/',
    children: [],
    isLeaf: true,
    isDynamic: false,
    isCatchAll: false,
    ...overrides,
  };
}

function makeReport(overrides: Partial<TraceReport> = {}): TraceReport {
  return {
    entries: [],
    totalRoutes: 0,
    maxDepth: 0,
    leafCount: 0,
    ...overrides,
  };
}

describe('buildTraceSummary', () => {
  it('shows all stats', () => {
    const report = makeReport({
      entries: [
        makeEntry({ isDynamic: true }),
        makeEntry({ route: '/[...slug]', isCatchAll: true }),
      ],
      totalRoutes: 2,
      maxDepth: 1,
      leafCount: 2,
    });
    const summary = buildTraceSummary(report);
    expect(summary).toContain('Routes: 2');
    expect(summary).toContain('Max depth');
    expect(summary).toContain('Dynamic   : 1');
    expect(summary).toContain('Catch-all : 1');
  });
});

describe('renderTraceTree', () => {
  it('returns (empty) for empty report', () => {
    expect(renderTraceTree(makeReport())).toBe('(empty)');
  });

  it('renders top-level routes', () => {
    const report = makeReport({
      entries: [makeEntry({ route: '/about', depth: 1, parent: '/' })],
      totalRoutes: 1,
    });
    const output = renderTraceTree(report);
    expect(output).toContain('about');
  });
});

describe('renderTraceReport', () => {
  it('includes header and separator', () => {
    const report = makeReport();
    const output = renderTraceReport(report);
    expect(output).toContain('Route Trace');
    expect(output).toContain('─');
  });

  it('includes summary line', () => {
    const report = makeReport({ totalRoutes: 3, maxDepth: 2, leafCount: 2, entries: [] });
    const output = renderTraceReport(report);
    expect(output).toContain('Routes: 3');
  });
});
