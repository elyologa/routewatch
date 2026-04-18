import fs from 'fs';
import path from 'path';
import os from 'os';
import { resolveConfig } from './config';

function writeTempConfig(dir: string, name: string, content: object): string {
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, JSON.stringify(content), 'utf-8');
  return filePath;
}

describe('resolveConfig', () => {
  let tmpDir: string;
  let originalCwd: () => string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'routewatch-'));
    originalCwd = process.cwd;
    process.cwd = () => tmpDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns default config when no file or cli args', () => {
    const config = resolveConfig();
    expect(config.ignore).toEqual([]);
  });

  it('merges ignore from config file', () => {
    writeTempConfig(tmpDir, 'routewatch.config.json', { ignore: ['/admin'] });
    const config = resolveConfig();
    expect(config.ignore).toContain('/admin');
  });

  it('merges ignore from explicit config path', () => {
    const cfgPath = writeTempConfig(tmpDir, 'custom.json', { ignore: ['/secret'] });
    const config = resolveConfig(cfgPath);
    expect(config.ignore).toContain('/secret');
  });

  it('merges cli ignore patterns', () => {
    const config = resolveConfig(undefined, ['/api/internal']);
    expect(config.ignore).toContain('/api/internal');
  });

  it('merges all sources together', () => {
    writeTempConfig(tmpDir, '.routewatchrc', { ignore: ['/docs'] });
    const config = resolveConfig(undefined, ['/beta']);
    expect(config.ignore).toContain('/docs');
    expect(config.ignore).toContain('/beta');
  });

  it('warns and falls back to defaults on invalid config file', () => {
    const badPath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(badPath, 'NOT JSON', 'utf-8');
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const config = resolveConfig(badPath);
    expect(config.ignore).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
