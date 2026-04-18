import { filterRoutes, isPrivateSegment, isGroupSegment, shouldExclude, matchesPattern } from './routeFilter';

describe('matchesPattern', () => {
  it('matches exact strings', () => {
    expect(matchesPattern('admin', 'admin')).toBe(true);
  });

  it('matches wildcard patterns', () => {
    expect(matchesPattern('api/users', 'api/*')).toBe(true);
    expect(matchesPattern('other/path', 'api/*')).toBe(false);
  });
});

describe('isPrivateSegment', () => {
  it('detects underscore-prefixed segments', () => {
    expect(isPrivateSegment('_components')).toBe(true);
    expect(isPrivateSegment('components')).toBe(false);
  });
});

describe('isGroupSegment', () => {
  it('detects route groups', () => {
    expect(isGroupSegment('(marketing)')).toBe(true);
    expect(isGroupSegment('marketing')).toBe(false);
  });
});

describe('filterRoutes', () => {
  const routes = [
    'home',
    'admin/dashboard',
    '_components/button',
    '(marketing)/about',
    'node_modules/pkg',
    'api/users',
  ];

  it('excludes node_modules by default', () => {
    const result = filterRoutes(routes);
    expect(result).not.toContain('node_modules/pkg');
  });

  it('excludes private segments by default', () => {
    const result = filterRoutes(routes);
    expect(result).not.toContain('_components/button');
  });

  it('includes private segments when opted in', () => {
    const result = filterRoutes(routes, { includePrivate: true });
    expect(result).toContain('_components/button');
  });

  it('excludes group segments when opted out', () => {
    const result = filterRoutes(routes, { includeGroups: false });
    expect(result).not.toContain('(marketing)/about');
  });

  it('respects custom exclude patterns', () => {
    const result = filterRoutes(routes, { excludePatterns: ['admin/*'] });
    expect(result).not.toContain('admin/dashboard');
  });
});
