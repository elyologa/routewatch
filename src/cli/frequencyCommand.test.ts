import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerFrequencyCommand } from './frequencyCommand';

function makeAppDir(): string {
  const base = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-freq-cmd-'));
  const app = path.join(base, 'app');
  fs.mkdirSync(app);
  fs.writeFileSync(path.join(app, 'page.tsx'), '');
  const about = path.join(app, 'about');
  fs.mkdirSync(about);
  fs.writeFileSync(path.join(about, 'page.tsx'), '');
  return base;
}

function makeConfig(base: string, extra: Record<string, unknown> = {}): string {
  const cfg = path.join(base, 'routewatch.config.json');
  fs.writeFileSync(cfg, JSON.stringify({ appDir: path.join(base, 'app'), ...extra }));
  return cfg;
}

describe('registerFrequencyCommand', () => {
  it('registers the frequency command without error', () => {
    const program = new Command();
    expect(() => registerFrequencyCommand(program)).not.toThrow();
    const cmd = program.commands.find(c => c.name() === 'frequency');
    expect(cmd).toBeDefined();
  });

  it('outputs JSON when --json flag is passed', async () => {
    const base = makeAppDir();
    makeConfig(base);
    const logs: string[] = [];
    const spy = jest.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));

    const program = new Command();
    registerFrequencyCommand(program);
    await program.parseAsync([
      'node', 'rw', 'frequency',
      '--dir', path.join(base, 'app'),
      '--src', base,
      '--json',
    ]);

    spy.mockRestore();
    const output = logs.join('\n');
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('totalRoutes');
    expect(parsed).toHaveProperty('entries');
    expect(Array.isArray(parsed.entries)).toBe(true);
    fs.rmSync(base, { recursive: true });
  });

  it('filters routes by --min references', async () => {
    const base = makeAppDir();
    makeConfig(base);
    const logs: string[] = [];
    const spy = jest.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));

    const program = new Command();
    registerFrequencyCommand(program);
    await program.parseAsync([
      'node', 'rw', 'frequency',
      '--dir', path.join(base, 'app'),
      '--src', base,
      '--json',
      '--min', '1',
    ]);

    spy.mockRestore();
    const parsed = JSON.parse(logs.join('\n'));
    expect(parsed.entries.every((e: { referenceCount: number }) => e.referenceCount >= 1)).toBe(true);
    fs.rmSync(base, { recursive: true });
  });
});
