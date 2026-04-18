import fs from 'fs';
import os from 'os';
import path from 'path';
import { exportReport, exportToMarkdown, exportToCsv } from './reportExporter';
import { Report } from '../analyzer/deadRouteAnalyzer';

function makeReport(overrides: Partial<Report> = {}): Report {
  return {
    totalRoutes: 3,
    deadRoutes: [
      { path: '/about', reason: 'no page file', segment: 'about' },
    ],
    ...overrides,
  };
}

describe('exportToMarkdown', () => {
  it('includes total and dead route counts', () => {
    const md = exportToMarkdown(makeReport());
    expect(md).toContain('**Total Routes:** 3');
    expect(md).toContain('**Dead Routes:** 1');
    expect(md).toContain('`/about`');
  });

  it('shows no dead routes message when empty', () => {
    const md = exportToMarkdown(makeReport({ deadRoutes: [], totalRoutes: 2 }));
    expect(md).toContain('_No dead routes found._');
  });
});

describe('exportToCsv', () => {
  it('produces header and one data row', () => {
    const csv = exportToCsv(makeReport());
    const lines = csv.split('\n');
    expect(lines[0]).toBe('path,reason,segment');
    expect(lines[1]).toContain('/about');
    expect(lines[1]).toContain('no page file');
  });
});

describe('exportReport', () => {
  let tmpDir: string;
  beforeEach(() => { tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-')); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('writes json file', () => {
    const out = path.join(tmpDir, 'report.json');
    exportReport(makeReport(), { format: 'json', outputPath: out });
    const data = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(data.totalRoutes).toBe(3);
  });

  it('writes markdown file', () => {
    const out = path.join(tmpDir, 'report.md');
    exportReport(makeReport(), { format: 'markdown', outputPath: out });
    expect(fs.readFileSync(out, 'utf-8')).toContain('RouteWatch Report');
  });

  it('writes csv file', () => {
    const out = path.join(tmpDir, 'report.csv');
    exportReport(makeReport(), { format: 'csv', outputPath: out });
    expect(fs.readFileSync(out, 'utf-8')).toContain('path,reason,segment');
  });

  it('creates nested output directories', () => {
    const out = path.join(tmpDir, 'nested', 'deep', 'report.json');
    exportReport(makeReport(), { format: 'json', outputPath: out });
    expect(fs.existsSync(out)).toBe(true);
  });
});
