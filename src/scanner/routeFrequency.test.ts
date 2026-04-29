import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  collectPaths,
  analyzeFrequency,
  formatFrequencyReport,
  scanForReferences,
} from './routeFrequency';
import type { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, path: segment };
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'rw-freq-'));
}

describe('collectPaths', () => {
  it('returns all route paths from tree', () => {
    const tree = makeNode('root', [
      makeNode('about'),
      makeNode('blog', [makeNode('[slug]')]),
    ]);
    const paths = collectPaths(tree);
    expect(paths).toContain('/about');
    expect(paths).toContain('/blog');
    expect(paths).toContain('/blog/[slug]');
  });

  it('returns empty for root with no children', () => {
    const tree = makeNode('root');
    expect(collectPaths(tree)).toHaveLength(0);
  });
});

describe('scanForReferences', () => {
  it('finds route references in source files', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'page.tsx'), `import Link from 'next/link'; <Link href="/about" />`);
    const refs = scanForReferences(dir, ['/about', '/blog']);
    expect(refs.get('/about')).toHaveLength(1);
    expect(refs.get('/blog')).toHaveLength(0);
    fs.rmSync(dir, { recursive: true });
  });
});

describe('analyzeFrequency', () => {
  it('produces a frequency report', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'nav.tsx'), `href="/about"`);
    const tree = makeNode('root', [makeNode('about'), makeNode('contact')]);
    const report = analyzeFrequency(tree, dir);
    expect(report.totalRoutes).toBe(2);
    const aboutEntry = report.entries.find(e => e.path === '/about');
    expect(aboutEntry?.referenceCount).toBe(1);
    expect(report.unreferenced).toBe(1);
    fs.rmSync(dir, { recursive: true });
  });
});

describe('formatFrequencyReport', () => {
  it('renders a readable report string', () => {
    const report = {
      entries: [
        { path: '/about', referenceCount: 3, referencedBy: ['a.tsx', 'b.tsx', 'c.tsx'] },
        { path: '/contact', referenceCount: 0, referencedBy: [] },
      ],
      totalRoutes: 2,
      unreferenced: 1,
      mostReferenced: { path: '/about', referenceCount: 3, referencedBy: [] },
    };
    const output = formatFrequencyReport(report);
    expect(output).toContain('/about');
    expect(output).toContain('Unreferenced: 1');
    expect(output).toContain('███');
  });
});
