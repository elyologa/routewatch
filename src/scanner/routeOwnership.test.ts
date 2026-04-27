import { describe, it, expect } from 'vitest';
import type { RouteNode } from '../scanner/routeScanner';
import {
  matchesPattern,
  resolveOwner,
  collectOwnership,
  formatOwnershipReport,
} from './routeOwnership';

function makeNode(
  segment: string,
  children: RouteNode[] = []
): RouteNode {
  return { segment, children, path: segment } as unknown as RouteNode;
}

const rules = [
  { pattern: '/dashboard*', owner: 'team-alpha', team: 'alpha' },
  { pattern: '/api*', owner: 'team-backend' },
  { pattern: '/profile', owner: 'team-beta', team: 'beta' },
];

describe('matchesPattern', () => {
  it('matches exact patterns', () => {
    expect(matchesPattern('/profile', '/profile')).toBe(true);
  });

  it('matches wildcard patterns', () => {
    expect(matchesPattern('/dashboard/settings', '/dashboard*')).toBe(true);
    expect(matchesPattern('/api/users', '/api*')).toBe(true);
  });

  it('does not match unrelated routes', () => {
    expect(matchesPattern('/about', '/dashboard*')).toBe(false);
  });
});

describe('resolveOwner', () => {
  it('returns the first matching rule', () => {
    const rule = resolveOwner('/dashboard/home', rules);
    expect(rule?.owner).toBe('team-alpha');
  });

  it('returns undefined when no rule matches', () => {
    expect(resolveOwner('/contact', rules)).toBeUndefined();
  });
});

describe('collectOwnership', () => {
  it('assigns owners and collects unowned routes', () => {
    const root = makeNode('root', [
      makeNode('dashboard', [makeNode('settings')]),
      makeNode('api', [makeNode('users')]),
      makeNode('about'),
    ]);
    const report = collectOwnership(root, rules);
    expect(report.routes.some(r => r.route === '/dashboard')).toBe(true);
    expect(report.unowned).toContain('/about');
    expect(report.byOwner['team-alpha']).toBeDefined();
  });

  it('groups routes by owner', () => {
    const root = makeNode('root', [
      makeNode('dashboard'),
      makeNode('api'),
    ]);
    const report = collectOwnership(root, rules);
    expect(Object.keys(report.byOwner).length).toBeGreaterThan(0);
  });
});

describe('formatOwnershipReport', () => {
  it('renders a readable report', () => {
    const root = makeNode('root', [makeNode('dashboard'), makeNode('unknown')]);
    const report = collectOwnership(root, rules);
    const output = formatOwnershipReport(report);
    expect(output).toContain('Route Ownership Report');
    expect(output).toContain('team-alpha');
    expect(output).toContain('Unowned Routes');
  });
});
