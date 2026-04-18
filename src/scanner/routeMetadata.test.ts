import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { extractMetadata, collectMetadata } from './routeMetadata';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routemeta-'));
}

describe('extractMetadata', () => {
  it('detects dynamic segment', () => {
    const dir = makeTempDir();
    const meta = extractMetadata('/users/[id]', dir);
    expect(meta.isDynamic).toBe(true);
    expect(meta.isCatchAll).toBe(false);
  });

  it('detects catch-all segment', () => {
    const dir = makeTempDir();
    const meta = extractMetadata('/docs/[...slug]', dir);
    expect(meta.isCatchAll).toBe(true);
    expect(meta.isDynamic).toBe(false);
  });

  it('detects parallel route', () => {
    const dir = makeTempDir();
    const meta = extractMetadata('/dashboard/@modal', dir);
    expect(meta.isParallelRoute).toBe(true);
  });

  it('reports correct depth', () => {
    const dir = makeTempDir();
    expect(extractMetadata('/a/b/c', dir).depth).toBe(3);
    expect(extractMetadata('/', dir).depth).toBe(0);
  });

  it('detects special files', () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, 'layout.tsx'), '');
    fs.writeFileSync(path.join(dir, 'loading.tsx'), '');
    const meta = extractMetadata('/home', dir);
    expect(meta.hasLayout).toBe(true);
    expect(meta.hasLoading).toBe(true);
    expect(meta.hasError).toBe(false);
  });
});

describe('collectMetadata', () => {
  it('maps multiple routes', () => {
    const dir = makeTempDir();
    const results = collectMetadata([
      { path: '/a', absDir: dir },
      { path: '/b/[id]', absDir: dir },
    ]);
    expect(results).toHaveLength(2);
    expect(results[1].isDynamic).toBe(true);
  });
});
