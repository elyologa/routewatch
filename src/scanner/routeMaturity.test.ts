import { assessMaturity, formatMaturityReport, RouteMaturityInfo, MaturityReport } from './routeMaturity';
import { RouteNode } from './routeScanner';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeNode(segment: string, isPage: boolean, children: RouteNode[] = []): RouteNode {
  return { segment, isPage, children, isDynamic: false, isCatchAll: false };
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routeMaturity-'));
}

describe('assessMaturity', () => {
  it('returns empty report for node with no pages', () => {
    const root = makeNode('app', false, []);
    const report = assessMaturity(root, '/tmp/nonexistent');
    expect(report.routes).toHaveLength(0);
    expect(report.summary.new).toBe(0);
  });

  it('classifies a brand-new page as new', () => {
    const tmpDir = makeTempDir();
    const pageDir = path.join(tmpDir, 'app', 'about');
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, 'page.tsx'), 'export default function About() {}');

    const root = makeNode('app', false, [
      makeNode('about', true),
    ]);

    const report = assessMaturity(root, path.join(tmpDir, 'app'));
    expect(report.routes).toHaveLength(1);
    expect(report.routes[0].maturityLevel).toBe('new');
    expect(report.routes[0].path).toBe('/about');
    expect(report.summary.new).toBe(1);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('marks hasTests when test file exists', () => {
    const tmpDir = makeTempDir();
    const pageDir = path.join(tmpDir, 'app', 'dashboard');
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, 'page.tsx'), '');
    fs.writeFileSync(path.join(pageDir, 'page.test.tsx'), '');

    const root = makeNode('app', false, [
      makeNode('dashboard', true),
    ]);

    const report = assessMaturity(root, path.join(tmpDir, 'app'));
    expect(report.routes[0].hasTests).toBe(true);

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('accumulates summary counts correctly', () => {
    const root = makeNode('app', false, [
      makeNode('a', true),
      makeNode('b', true),
    ]);
    const report = assessMaturity(root, '/tmp/nonexistent');
    const total = Object.values(report.summary).reduce((a, b) => a + b, 0);
    expect(total).toBe(report.routes.length);
  });
});

describe('formatMaturityReport', () => {
  it('includes header and summary', () => {
    const report: MaturityReport = {
      routes: [
        { path: '/home', maturityLevel: 'stable', ageInDays: 60, hasTests: true, hasTypes: false, commitCount: 0 },
      ],
      summary: { new: 0, developing: 0, stable: 1, mature: 0 },
    };
    const output = formatMaturityReport(report);
    expect(output).toContain('Route Maturity Report');
    expect(output).toContain('/home');
    expect(output).toContain('stable');
    expect(output).toContain('Summary');
  });
});
