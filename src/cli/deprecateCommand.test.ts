import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerDeprecateCommand } from './deprecateCommand';

function makeAppDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-dep-'));
  fs.mkdirSync(path.join(dir, 'about'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'about', 'page.tsx'), '');
  fs.mkdirSync(path.join(dir, 'legacy'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'legacy', 'page.tsx'), '');
  return dir;
}

function makeConfig(appDir: string, extra = {}): string {
  const cfgPath = path.join(appDir, 'routewatch.json');
  fs.writeFileSync(cfgPath, JSON.stringify({ appDir, ...extra }));
  return cfgPath;
}

describe('deprecateCommand', () => {
  it('registers without error', () => {
    const program = new Command();
    expect(() => registerDeprecateCommand(program)).not.toThrow();
    const cmd = program.commands.find(c => c.name() === 'deprecate');
    expect(cmd).toBeDefined();
  });

  it('runs with no deprecation rules', async () => {
    const appDir = makeAppDir();
    const cfgPath = makeConfig(appDir);
    const program = new Command();
    registerDeprecateCommand(program);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'rw', 'deprecate', '-d', appDir, '-c', cfgPath]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No deprecation rules'));
    spy.mockRestore();
  });

  it('outputs json when --json flag set', async () => {
    const appDir = makeAppDir();
    const cfgPath = makeConfig(appDir, { deprecations: [{ pattern: '//legacy', reason: 'Old' }] });
    const program = new Command();
    registerDeprecateCommand(program);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'rw', 'deprecate', '-d', appDir, '-c', cfgPath, '--json']);
    const output = spy.mock.calls.map(c => c[0]).join('');
    expect(output).toContain('[');
    spy.mockRestore();
  });
});
