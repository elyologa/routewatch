import fs from 'fs';
import path from 'path';
import os from 'os';
import { scanRoutes, RouteNode } from './routeScanner';

function createFixture(structure: Record<string, string[]>): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-'));
  for (const [dir, files] of Object.entries(structure)) {
    const fullDir = path.join(tmpDir, dir);
    fs.mkdirSync(fullDir, { recursive: true });
    for (const file of files) {
      fs.writeFileSync(path.join(fullDir, file), '');
    }
  }
  return tmpDir;
}

describe('scanRoutes', () => {
  it('throws if app directory does not exist', () => {
    expect(() => scanRoutes('/nonexistent/path')).toThrow('App directory not found');
  });

  it('returns empty array for empty app directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-'));
    expect(scanRoutes(tmpDir)).toEqual([]);
  });

  it('detects a simple route with page.tsx', () => {
    const root = createFixture({ 'about': ['page.tsx'] });
    const routes = scanRoutes(root);
    expect(routes).toHaveLength(1);
    expect(routes[0].segment).toBe('about');
    expect(routes[0].hasPage).toBe(true);
    expect(routes[0].isDynamic).toBe(false);
  });

  it('detects dynamic segments', () => {
    const root = createFixture({ '[id]': ['page.tsx'] });
    const routes = scanRoutes(root);
    expect(routes[0].isDynamic).toBe(true);
    expect(routes[0].isCatchAll).toBe(false);
  });

  it('detects catch-all segments', () => {
    const root = createFixture({ '[...slug]': ['page.tsx'] });
    const routes = scanRoutes(root);
    expect(routes[0].isCatchAll).toBe(true);
  });

  it('detects route groups and does not add segment to path', () => {
    const root = createFixture({ '(marketing)': [], '(marketing)/home': ['page.tsx'] });
    const routes = scanRoutes(root);
    const group = routes.find((r) => r.segment === '(marketing)');
    expect(group?.isRouteGroup).toBe(true);
    expect(group?.fullPath).toBe('/');
  });

  it('detects nested routes', () => {
    const root = createFixture({
      'blog': [],
      'blog/[slug]': ['page.tsx', 'layout.tsx'],
    });
    const routes = scanRoutes(root);
    const blog = routes.find((r) => r.segment === 'blog')!;
    expect(blog.children).toHaveLength(1);
    expect(blog.children[0].hasLayout).toBe(true);
  });
});
