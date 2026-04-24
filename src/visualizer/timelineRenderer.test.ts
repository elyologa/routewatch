import { renderTimelineEntry, buildTimelineSummary, renderTimelineReport } from './timelineRenderer';
import type { TimelineReport, TimelineEntry } from '../scanner/routeTimeline';

function makeEntry(route: string, ageInDays: number | null): TimelineEntry {
  return {
    route,
    createdAt: ageInDays !== null ? new Date() : null,
    modifiedAt: ageInDays !== null ? new Date() : null,
    ageInDays,
  };
}

function makeReport(overrides: Partial<TimelineReport> = {}): TimelineReport {
  const entries = [makeEntry('/', 10), makeEntry('/about', 200), makeEntry('/contact', null)];
  return {
    entries,
    oldest: entries[1],
    newest: entries[0],
    averageAgeInDays: 105,
    ...overrides,
  };
}

describe('renderTimelineEntry', () => {
  it('renders route name', () => {
    const entry = makeEntry('/dashboard', 45);
    const result = renderTimelineEntry(entry, 200);
    expect(result).toContain('/dashboard');
    expect(result).toContain('45d');
  });

  it('renders unknown age for null', () => {
    const entry = makeEntry('/unknown', null);
    const result = renderTimelineEntry(entry, 200);
    expect(result).toContain('?');
  });
});

describe('buildTimelineSummary', () => {
  it('includes oldest and newest', () => {
    const report = makeReport();
    const summary = buildTimelineSummary(report);
    expect(summary).toContain('/about');
    expect(summary).toContain('/');
    expect(summary).toContain('105d');
  });

  it('handles null oldest/newest gracefully', () => {
    const report = makeReport({ oldest: null, newest: null, averageAgeInDays: null });
    const summary = buildTimelineSummary(report);
    expect(summary).toBe('');
  });
});

describe('renderTimelineReport', () => {
  it('includes all routes', () => {
    const report = makeReport();
    const output = renderTimelineReport(report);
    expect(output).toContain('/about');
    expect(output).toContain('/contact');
    expect(output).toContain('Route Timeline');
  });
});
