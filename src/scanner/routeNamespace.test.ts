import { describe, it, expect } from 'vitest';
import {
  extractNamespace,
  groupByNamespace,
  formatNamespaceReport,
} from './routeNamespace';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  opts: Partial<RouteNode> = {},
  children: RouteNode[] = []
): RouteNode {
  return { segment, hasPage: false, hasLayout: false, children, ...opts };
}

describe('extractNamespace', () => {
  it('returns first static segment', () => {
    expect(extractNamespace('/dashboard/settings')).toBe('dashboard');
  });

  it('returns null for dynamic first segment', () => {
    expect(extractNamespace('/[id]/profile')).toBeNull();
  });

  it('returns null for group segment', () => {
    expect(extractNamespace('/(auth)/login')).toBeNull();
  });

  it('returns null for private segment', () => {
    expect(extractNamespace('/_internal/page')).toBeNull();
  });

  it('returns null for root path', () => {
    expect(extractNamespace('/')).toBeNull();
  });
});

describe('groupByNamespace', () => {
  it('groups routes by top-level namespace', () => {
    const root = makeNode('root', {}, [
      makeNode('dashboard', { hasPage: true }, [
        makeNode('settings', { hasPage: true }),
        makeNode('users', { hasPage: true }),
      ]),
      makeNode('api', { hasPage: false }, [
        makeNode('health', { hasPage: true }),
      ]),
    ]);

    const report = groupByNamespace(root);
    expect(report.groups).toHaveLength(2);
    const dash = report.groups.find((g) => g.namespace === 'dashboard');
    expect(dash?.count).toBe(3);
    const api = report.groups.find((g) => g.namespace === 'api');
    expect(api?.count).toBe(1);
    expect(report.ungrouped).toHaveLength(0);
    expect(report.total).toBe(4);
  });

  it('places root page in ungrouped', () => {
    const root = makeNode('root', { hasPage: true }, [
      makeNode('about', { hasPage: true }),
    ]);
    const report = groupByNamespace(root);
    expect(report.ungrouped).toContain('/');
    expect(report.groups[0].namespace).toBe('about');
  });
});

describe('formatNamespaceReport', () => {
  it('renders namespace groups and ungrouped routes', () => {
    const report = {
      groups: [{ namespace: 'admin', routes: ['/admin', '/admin/users'], count: 2 }],
      ungrouped: ['/'],
      total: 3,
    };
    const output = formatNamespaceReport(report);
    expect(output).toContain('admin/');
    expect(output).toContain('/admin/users');
    expect(output).toContain('ungrouped');
    expect(output).toContain('/');
  });
});
