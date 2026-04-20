import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { checkRouteHealth, formatHealthReport } from './routeHealthChecker';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children };
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rw-health-'));
}

describe('checkRouteHealth', () => {
  it('reports healthy when page.tsx exists', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'layout.tsx'), '');
    fs.writeFileSync(path.join(dir, 'page.tsx'), '');
    const root = makeNode('');
    const report = checkRouteHealth(root, dir);
    expect(report.healthy).toBe(1);
    expect(report.errors).toBe(0);
  });

  it('reports error when root has no layout', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'page.tsx'), '');
    const root = makeNode('');
    const report = checkRouteHealth(root, dir);
    const rootHealth = report.routes.find(r => r.path === '/');
    expect(rootHealth?.status).toBe('error');
    expect(rootHealth?.issues.some(i => i.type === 'missing-layout')).toBe(true);
  });

  it('reports warning for segment with children but no page', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'layout.tsx'), '');
    const aboutDir = path.join(dir, 'about');
    fs.mkdirSync(aboutDir);
    const teamDir = path.join(aboutDir, 'team');
    fs.mkdirSync(teamDir);
    fs.writeFileSync(path.join(teamDir, 'page.tsx'), '');
    const root = makeNode('', [
      makeNode('about', [makeNode('team')]),
    ]);
    const report = checkRouteHealth(root, dir);
    const aboutHealth = report.routes.find(r => r.path === '/about');
    expect(aboutHealth?.status).toBe('warning');
    expect(aboutHealth?.issues.some(i => i.type === 'missing-page')).toBe(true);
  });

  it('reports error for empty segment with no page and no children', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'layout.tsx'), '');
    const emptyDir = path.join(dir, 'empty');
    fs.mkdirSync(emptyDir);
    const root = makeNode('', [makeNode('empty')]);
    const report = checkRouteHealth(root, dir);
    const emptyHealth = report.routes.find(r => r.path === '/empty');
    expect(emptyHealth?.status).toBe('error');
    expect(emptyHealth?.issues.some(i => i.type === 'empty-segment')).toBe(true);
  });
});

describe('formatHealthReport', () => {
  it('includes summary line', () => {
    const report = { healthy: 3, warnings: 1, errors: 0, routes: [] };
    const output = formatHealthReport(report);
    expect(output).toContain('3 healthy');
    expect(output).toContain('1 warnings');
  });

  it('lists issues for affected routes', () => {
    const report = {
      healthy: 0, warnings: 0, errors: 1,
      routes: [{
        path: '/broken',
        status: 'error' as const,
        issues: [{ type: 'empty-segment' as const, message: 'No page and no children' }],
      }],
    };
    const output = formatHealthReport(report);
    expect(output).toContain('/broken');
    expect(output).toContain('empty-segment');
  });
});
