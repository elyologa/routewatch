import fs from 'fs';
import os from 'os';
import path from 'path';
import { runExportCommand } from './exportCommand';
import { ResolvedConfig } from './config';

function makeAppDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-app-'));
  fs.mkdirSync(path.join(dir, 'about'));
  fs.writeFileSync(path.join(dir, 'about', 'page.tsx'), 'export default function About() {}');
  return dir;
}

function makeConfig(appDir: string): ResolvedConfig {
  return { appDir, exclude: [], include: [] };
}

describe('runExportCommand', () => {
  let appDir: string;
  let tmpDir: string;

  beforeEach(() => {
    appDir = makeAppDir();
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-out-'));
  });

  afterEach(() => {
    fs.rmSync(appDir, { recursive: true });
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('exports a json report to specified output', async () => {
    const out = path.join(tmpDir, 'report.json');
    await runExportCommand(makeConfig(appDir), { format: 'json', output: out });
    const data = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(typeof data.totalRoutes).toBe('number');
  });

  it('exports a markdown report', async () => {
    const out = path.join(tmpDir, 'report.md');
    await runExportCommand(makeConfig(appDir), { format: 'markdown', output: out });
    expect(fs.readFileSync(out, 'utf-8')).toContain('RouteWatch Report');
  });

  it('throws on invalid format', async () => {
    await expect(
      runExportCommand(makeConfig(appDir), { format: 'xml', output: path.join(tmpDir, 'r.xml') })
    ).rejects.toThrow('Invalid format');
  });
});
