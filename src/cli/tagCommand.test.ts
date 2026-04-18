import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerTagCommand } from './tagCommand';

function makeAppDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-tag-'));
  const app = path.join(dir, 'app');
  fs.mkdirSync(path.join(app, 'api', 'users'), { recursive: true });
  fs.writeFileSync(path.join(app, 'api', 'users', 'page.tsx'), '');
  fs.mkdirSync(path.join(app, 'about'), { recursive: true });
  fs.writeFileSync(path.join(app, 'about', 'page.tsx'), '');
  return dir;
}

function makeConfig(dir: string, tags: object[]): string {
  const cfg = path.join(dir, 'routewatch.config.json');
  fs.writeFileSync(cfg, JSON.stringify({ tags }));
  return cfg;
}

describe('tagCommand', () => {
  it('registers tag command', () => {
    const program = new Command();
    registerTagCommand(program);
    const cmd = program.commands.find(c => c.name() === 'tag');
    expect(cmd).toBeDefined();
  });

  it('outputs json for matching routes', async () => {
    const dir = makeAppDir();
    const cfg = makeConfig(dir, [{ pattern: '/api/*', tag: 'api' }]);
    const logs: string[] = [];
    const spy = jest.spyOn(console, 'log').mockImplementation(m => logs.push(m));

    const program = new Command();
    registerTagCommand(program);
    await program.parseAsync(['tag', '--dir', path.join(dir, 'app'), '--config', cfg, '--json'], { from: 'user' });

    spy.mockRestore();
    const parsed = JSON.parse(logs[0]);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].tags).toContain('api');
  });
});
