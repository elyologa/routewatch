import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  collectPaths,
  createSnapshot,
  saveSnapshot,
  loadSnapshot,
  diffSnapshots,
} from './routeSnapshot';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  isRoute = false,
  children: RouteNode[] = []
): RouteNode {
  return { segment, isRoute, children };
}

describe('collectPaths', () => {
  it('collects route paths from tree', () => {
    const tree = makeNode('', false, [
      makeNode('about', true),
      makeNode('blog', false, [makeNode('[slug]', true)]),
    ]);
    const paths = collectPaths(tree);
    expect(paths).toContain('/about');
    expect(paths).toContain('/blog/[slug]');
  });
});

describe('createSnapshot', () => {
  it('includes timestamp and paths', () => {
    const tree = makeNode('', false, [makeNode('home', true)]);
    const snap = createSnapshot(tree);
    expect(snap.paths).toContain('/home');
    expect(snap.timestamp).toBeTruthy();
    expect(snap.version).toBe(1);
  });
});

describe('saveSnapshot / loadSnapshot', () => {
  it('round-trips snapshot to disk', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'snap-'));
    const filePath = path.join(dir, 'snapshot.json');
    const snap = { timestamp: '2024-01-01T00:00:00Z', version: 1, paths: ['/a', '/b'] };
    saveSnapshot(snap, filePath);
    const loaded = loadSnapshot(filePath);
    expect(loaded).toEqual(snap);
  });
});

describe('diffSnapshots', () => {
  it('detects added and removed routes', () => {
    const before = { timestamp: '', version: 1, paths: ['/a', '/b'] };
    const after = { timestamp: '', version: 1, paths: ['/b', '/c'] };
    const diff = diffSnapshots(before, after);
    expect(diff.added).toEqual(['/c']);
    expect(diff.removed).toEqual(['/a']);
  });

  it('returns empty arrays when no change', () => {
    const snap = { timestamp: '', version: 1, paths: ['/a'] };
    const diff = diffSnapshots(snap, snap);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });
});
