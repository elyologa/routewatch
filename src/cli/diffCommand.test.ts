import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runDiffCommand } from './diffCommand';
import { ResolvedConfig } from './config';

function makeAppDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-diff-'));
  const about = path.join(dir, 'about');
  fs.mkdirSync(about);
  fs.writeFileSync(path.join(about, 'page.tsx'), '');
  return dir;
}

function makeConfig(appDir: string): ResolvedConfig {
  return { appDir, exclude: [], extensions: ['tsx', 'ts', 'js', 'jsx'] };
}

describe('runDiffCommand', () => {
  let appDir: string;
  let snapshotPath: string;

  beforeEach(() => {
    appDir = makeAppDir();
    snapshotPath = path.join(appDir, '.snapshot.json');
  });

  afterEach(() => {
    fs.rmSync(appDir, { recursive: true, force: true });
  });

  it('creates snapshot when none exists', async () => {
    await runDiffCommand(makeConfig(appDir), { snapshotPath });
    expect(fs.existsSync(snapshotPath)).toBe(true);
  });

  it('reports no changes when routes unchanged', async () => {
    await runDiffCommand(makeConfig(appDir), { snapshotPath });
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await runDiffCommand(makeConfig(appDir), { snapshotPath });
    const output = spy.mock.calls.map(c => c[0]).join('\n');
    expect(output).toContain('No changes detected.');
    spy.mockRestore();
  });

  it('saves updated snapshot when --save passed', async () => {
    await runDiffCommand(makeConfig(appDir), { snapshotPath });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    await runDiffCommand(makeConfig(appDir), { snapshotPath, save: true });
    const data = JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
    expect(Array.isArray(data)).toBe(true);
  });
});
