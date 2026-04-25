import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { registerConflictCommand } from './conflictCommand';

function makeAppDir(structure: Record<string, string[]>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'rw-conflict-'));
  for (const [dir, files] of Object.entries(structure)) {
    const full = path.join(root, dir);
    fs.mkdirSync(full, { recursive: true });
    for (const file of files) {
      fs.writeFileSync(path.join(full, file), '');
    }
  }
  return root;
}

describe('conflictCommand', () => {
  let program: Command;
  let output: string;

  beforeEach(() => {
    program = new Command();
    program.exitOverride();
    output = '';
    jest.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
      output += chunk;
      return true;
    });
    jest.spyOn(console, 'log').mockImplementation((msg) => { output += msg; });
  });

  afterEach(() => jest.restoreAllMocks());

  it('registers the conflict command', () => {
    registerConflictCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'conflict');
    expect(cmd).toBeDefined();
  });

  it('outputs JSON when --json flag is set', async () => {
    const appDir = makeAppDir({ '[id]': ['page.tsx'], '[slug]': ['page.tsx'] });
    registerConflictCommand(program);
    try {
      await program.parseAsync(['node', 'rw', 'conflict', '--dir', appDir, '--json']);
    } catch {
      // exit override
    }
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('total');
    expect(parsed).toHaveProperty('conflicts');
  });

  it('reports no conflicts for non-ambiguous routes', async () => {
    const appDir = makeAppDir({ about: ['page.tsx'], contact: ['page.tsx'] });
    registerConflictCommand(program);
    await program.parseAsync(['node', 'rw', 'conflict', '--dir', appDir]);
    expect(output).toContain('No route conflicts detected');
  });
});
