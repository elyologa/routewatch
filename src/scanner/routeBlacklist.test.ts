import { describe, it, expect } from 'vitest';
import {
  checkBlacklist,
  formatBlacklistReport,
  matchesRule,
  BlacklistRule,
} from './routeBlacklist';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, hasPage: true };
}

const rules: BlacklistRule[] = [
  { pattern: '/admin/*', reason: 'admin area restricted' },
  { pattern: '/internal', reason: 'internal only' },
];

describe('matchesRule', () => {
  it('matches wildcard patterns', () => {
    expect(matchesRule('/admin/users', { pattern: '/admin/*' })).toBe(true);
    expect(matchesRule('/admin/settings', { pattern: '/admin/*' })).toBe(true);
  });

  it('does not match unrelated paths', () => {
    expect(matchesRule('/dashboard', { pattern: '/admin/*' })).toBe(false);
  });

  it('matches exact patterns', () => {
    expect(matchesRule('/internal', { pattern: '/internal' })).toBe(true);
    expect(matchesRule('/internals', { pattern: '/internal' })).toBe(false);
  });
});

describe('checkBlacklist', () => {
  it('detects blacklisted routes', () => {
    const root = makeNode('', [
      makeNode('admin', [makeNode('users'), makeNode('settings')]),
      makeNode('internal'),
      makeNode('dashboard'),
    ]);
    const report = checkBlacklist(root, rules);
    expect(report.total).toBe(3);
    const paths = report.blacklisted.map((b) => b.path);
    expect(paths).toContain('/admin/users');
    expect(paths).toContain('/admin/settings');
    expect(paths).toContain('/internal');
    expect(paths).not.toContain('/dashboard');
  });

  it('returns empty report when no matches', () => {
    const root = makeNode('', [makeNode('about'), makeNode('contact')]);
    const report = checkBlacklist(root, rules);
    expect(report.total).toBe(0);
    expect(report.blacklisted).toHaveLength(0);
  });
});

describe('formatBlacklistReport', () => {
  it('shows success message when no blacklisted routes', () => {
    const output = formatBlacklistReport({ blacklisted: [], total: 0 });
    expect(output).toContain('No blacklisted routes');
  });

  it('lists blacklisted routes with reasons', () => {
    const output = formatBlacklistReport({
      blacklisted: [
        { path: '/admin/users', rule: { pattern: '/admin/*', reason: 'admin area restricted' } },
      ],
      total: 1,
    });
    expect(output).toContain('/admin/users');
    expect(output).toContain('admin area restricted');
  });
});
