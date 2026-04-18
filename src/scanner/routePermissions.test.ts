import { collectPermissions, formatPermissions, PermissionRule } from './routePermissions';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, path: segment };
}

const rules: PermissionRule[] = [
  { pattern: '/admin', roles: ['admin'] },
  { pattern: '/admin/[id]', roles: ['admin', 'moderator'] },
  { pattern: '/dashboard', roles: ['user', 'admin'] },
];

describe('collectPermissions', () => {
  it('matches top-level route', () => {
    const tree = makeNode('admin');
    const result = collectPermissions(tree, rules);
    expect(result).toEqual([{ path: '/admin', roles: ['admin'] }]);
  });

  it('matches dynamic child route', () => {
    const tree = makeNode('admin', [makeNode('[id]')]);
    const result = collectPermissions(tree, rules);
    expect(result.find(e => e.path === '/admin/[id]')?.roles).toContain('moderator');
  });

  it('returns empty when no rules match', () => {
    const tree = makeNode('public');
    const result = collectPermissions(tree, rules);
    expect(result).toHaveLength(0);
  });

  it('deduplicates roles from multiple matching rules', () => {
    const multiRules: PermissionRule[] = [
      { pattern: '/admin', roles: ['admin'] },
      { pattern: '/admin', roles: ['admin', 'superuser'] },
    ];
    const tree = makeNode('admin');
    const result = collectPermissions(tree, multiRules);
    expect(result[0].roles).toEqual(['admin', 'superuser']);
  });
});

describe('formatPermissions', () => {
  it('formats entries correctly', () => {
    const entries = [{ path: '/admin', roles: ['admin'] }];
    expect(formatPermissions(entries)).toBe('/admin  →  [admin]');
  });

  it('returns message when empty', () => {
    expect(formatPermissions([])).toMatch(/No permission/);
  });
});
