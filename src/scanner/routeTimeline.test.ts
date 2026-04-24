import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { collectTimeline, formatTimeline } from './routeTimeline';
import type { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, isDynamic: false, isCatchAll: false };
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'timeline-'));
}

describe('collectTimeline', () => {
  it('returns an entry for each node', () => {
    const root = makeNode('root', [makeNode('about'), makeNode('blog')]);
    const report = collectTimeline(root, '/nonexistent');
    expect(report.entries).toHaveLength(3);
    expect(report.entries.map(e => e.route)).toContain('/');
    expect(report.entries.map(e => e.route)).toContain('/about');
  });

  it('returns null dates for missing files', () => {
    const root = makeNode('root', [makeNode('contact')]);
    const report = collectTimeline(root, '/nonexistent');
    for (const entry of report.entries) {
      expect(entry.createdAt).toBeNull();
      expect(entry.modifiedAt).toBeNull();
      expect(entry.ageInDays).toBeNull();
    }
  });

  it('detects file dates when page.tsx exists', () => {
    const tmpDir = makeTempDir();
    const pageDir = path.join(tmpDir, 'about');
    fs.mkdirSync(pageDir, { recursive: true });
    fs.writeFileSync(path.join(pageDir, 'page.tsx'), 'export default function Page() {}');

    const root = makeNode('root', [makeNode('about')]);
    const report = collectTimeline(root, tmpDir);
    const aboutEntry = report.entries.find(e => e.route === '/about')!;
    expect(aboutEntry.modifiedAt).not.toBeNull();
    expect(aboutEntry.ageInDays).not.toBeNull();
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('computes oldest and newest correctly', () => {
    const root = makeNode('root', [makeNode('a'), makeNode('b')]);
    const report = collectTimeline(root, '/nonexistent');
    // all null — oldest/newest should be null
    expect(report.oldest).toBeNull();
    expect(report.newest).toBeNull();
    expect(report.averageAgeInDays).toBeNull();
  });
});

describe('formatTimeline', () => {
  it('includes header and route entries', () => {
    const root = makeNode('root', [makeNode('shop')]);
    const report = collectTimeline(root, '/nonexistent');
    const output = formatTimeline(report);
    expect(output).toContain('Route Timeline Report');
    expect(output).toContain('/shop');
    expect(output).toContain('unknown age');
  });
});
