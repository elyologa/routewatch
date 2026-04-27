import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { registerLineageCommand } from './lineageCommand';

function makeAppDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lineage-'));
  const pages = ['', 'about', 'about/team', 'blog'];
  for (const p of pages) {
    const full = path.join(dir, p);
    fs.mkdirSync(full, { recursive: true });
    fs.writeFileSync(path.join(full, 'page.tsx'), `export default function P() {}`);
  }
  return dir;
}

function makeConfig(appDir: string): string {
  const cfgPath = path.join(os.tmpdir(), `lineage-cfg-${Date.now()}.json`);
  fs.writeFileSync(cfgPath, JSON.stringify({ appDir }));
  return cfgPath;
}

describe('registerLineageCommand', () => {
  let appDir: string;
  let cfgPath: string;
  let output: string[];
  let originalLog: typeof console.log;

  beforeEach(() => {
    appDir = makeAppDir();
    cfgPath = makeConfig(appDir);
    output = [];
    originalLog = console.log;
    console.log = (...args: unknown[]) => output.push(args.join(' '));
  });

  afterEach(() => {
    console.log = originalLog;
    fs.rmSync(appDir, { recursive: true, force: true });
    fs.rmSync(cfgPath, { force: true });
  });

  it('prints lineage report in text mode', async () => {
    const program = new Command();
    registerLineageCommand(program);
    await program.parseAsync(['node', 'rw', 'lineage', '--dir', appDir]);
    const joined = output.join('\n');
    expect(joined).toContain('Route Lineage Report');
    expect(joined).toContain('Total routes');
  });

  it('prints JSON when --json flag is set', async () => {
    const program = new Command();
    registerLineageCommand(program);
    await program.parseAsync(['node', 'rw', 'lineage', '--dir', appDir, '--json']);
    const joined = output.join('\n');
    const parsed = JSON.parse(joined);
    expect(parsed).toHaveProperty('entries');
    expect(parsed).toHaveProperty('roots');
    expect(parsed).toHaveProperty('maxDepth');
  });

  it('respects --max-depth filter', async () => {
    const program = new Command();
    registerLineageCommand(program);
    await program.parseAsync(['node', 'rw', 'lineage', '--dir', appDir, '--max-depth', '1']);
    const joined = output.join('\n');
    expect(joined).not.toContain('team');
  });
});
