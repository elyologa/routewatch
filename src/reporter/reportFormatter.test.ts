import { formatReport, formatJson } from './reportFormatter';
import { AnalysisReport } from '../analyzer/deadRouteAnalyzer';

const sampleReport: AnalysisReport = {
  totalRoutes: 4,
  activeRoutes: ['/home', '/about', '/api/data'],
  deadRoutes: [
    { path: '/orphan', reason: 'No page, API route, or children found' },
  ],
};

describe('formatReport', () => {
  it('includes summary counts', () => {
    const output = formatReport(sampleReport, false);
    expect(output).toContain('Total routes scanned : 4');
    expect(output).toContain('Active routes        : 3');
    expect(output).toContain('Dead routes          : 1');
  });

  it('lists dead route paths', () => {
    const output = formatReport(sampleReport, false);
    expect(output).toContain('/orphan');
    expect(output).toContain('No page, API route, or children found');
  });

  it('omits dead routes section when none exist', () => {
    const cleanReport: AnalysisReport = {
      totalRoutes: 2,
      activeRoutes: ['/home', '/about'],
      deadRoutes: [],
    };
    const output = formatReport(cleanReport, false);
    expect(output).not.toContain('Dead Routes:');
  });

  it('includes ANSI codes when useColor is true', () => {
    const output = formatReport(sampleReport, true);
    expect(output).toContain('\x1b[');
  });
});

describe('formatJson', () => {
  it('returns valid JSON matching the report', () => {
    const json = formatJson(sampleReport);
    const parsed = JSON.parse(json);
    expect(parsed.totalRoutes).toBe(4);
    expect(parsed.deadRoutes).toHaveLength(1);
  });
});
