import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerChangelogCommand } from './changelogCommand';

function makeAppDir(routes: string[]): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-changelog-'));
  for (const r of routes) {
    const full = path.join(dir, r);
    fs.mkdirSync(full, { recursive: true });
    fs.writeFileSync(path.join(full, 'page.tsx'), 'export default function P() {}');
  }
  return dir;
}

function makeSnapshot(tree: object): string {
  const f = path.join(os.tmpdir(), `rw-snap-${Date.now()}.json`);
  fs.writeFileSync(f, JSON.stringify(tree));
  return f;
}

describe('registerChangelogCommand', () => {
  it('registers changelog command', () => {
    const program = new Command();
    registerChangelogCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'changelog');
    expect(cmd).toBeDefined();
  });

  it('outputs JSON changelog', async () => {
    const appDir = makeAppDir(['about', 'contact']);
    const snapshot = makeSnapshot({
      segment: '',
      hasPage: false,
      path: '',
      children: [{ segment: 'about', hasPage: true, path: 'about', children: [] }],
    });

    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((m) => logs.push(m));

    const program = new Command();
    registerChangelogCommand(program);
    await program.parseAsync(['node', 'rw', 'changelog', snapshot, appDir, '--json']);

    const out = JSON.parse(logs[0]);
    expect(out.entries).toBeDefined();
    jest.restoreAllMocks();
    fs.rmSync(appDir, { recursive: true });
    fs.unlinkSync(snapshot);
  });
});
