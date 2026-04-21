import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  buildPath,
  collectI18nRoutes,
  formatI18nReport,
  detectRouteLocales,
} from './routeI18n';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, hasPage: true };
}

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'routeI18n-'));
}

describe('buildPath', () => {
  it('creates root path', () => {
    expect(buildPath(makeNode('dashboard'))).toBe('/dashboard');
  });

  it('creates nested path', () => {
    expect(buildPath(makeNode('settings'), '/dashboard')).toBe('/dashboard/settings');
  });
});

describe('detectRouteLocales', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    fs.mkdirSync(path.join(tmpDir, 'en', 'dashboard'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'fr', 'dashboard'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('detects present locales', () => {
    const found = detectRouteLocales('/dashboard', tmpDir, ['en', 'fr', 'de']);
    expect(found).toEqual(['en', 'fr']);
  });

  it('returns empty when no locales match', () => {
    const found = detectRouteLocales('/unknown', tmpDir, ['en', 'fr']);
    expect(found).toEqual([]);
  });
});

describe('collectI18nRoutes', () => {
  it('reports missing locales for routes', () => {
    const root = makeNode('dashboard', [makeNode('settings')]);
    const report = collectI18nRoutes(root, '/nonexistent', ['en', 'fr'], 'en');
    expect(report.routes.length).toBe(2);
    expect(report.routes[0].missingLocales).toEqual(['en', 'fr']);
    expect(report.fullyTranslated).toBe(0);
    expect(report.partiallyTranslated).toBe(0);
  });
});

describe('formatI18nReport', () => {
  it('includes header and route lines', () => {
    const root = makeNode('about');
    const report = collectI18nRoutes(root, '/nonexistent', ['en'], 'en');
    const output = formatI18nReport(report);
    expect(output).toContain('I18n Coverage Report');
    expect(output).toContain('/about');
  });
});
