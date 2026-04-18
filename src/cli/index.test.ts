import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const CLI = path.resolve(__dirname, '../../dist/cli/index.js');

function makeAppDir(base: string, files: string[]): void {
  for (const f of files) {
    const full = path.join(base, f);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, '', 'utf-8');
  }
}

describe('CLI audit command (integration)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-cli-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('exits 0 when no dead routes found', () => {
    makeAppDir(tmpDir, ['page.tsx', 'about/page.tsx']);
    expect(() =>
      execSync(`node ${CLI} audit ${tmpDir} --format text`, { stdio: 'pipe' })
    ).not.toThrow();
  });

  it('outputs valid JSON with --format json', () => {
    makeAppDir(tmpDir, ['page.tsx']);
    const output = execSync(`node ${CLI} audit ${tmpDir} --format json`, {
      stdio: 'pipe',
    }).toString();
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('exits 2 on non-existent directory', () => {
    try {
      execSync(`node ${CLI} audit /nonexistent/path --format text`, { stdio: 'pipe' });
      fail('should have thrown');
    } catch (e: unknown) {
      const err = e as { status: number };
      expect(err.status).toBe(2);
    }
  });
});
