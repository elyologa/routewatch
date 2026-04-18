import { tagRoutes, formatTagged, TagRule } from './routeTaggar';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, isRoute: boolean, children: RouteNode[] = []): RouteNode {
  return { segment, isRoute, children };
}

describe('tagRoutes', () => {
  const rules: TagRule[] = [
    { pattern: '/api/*', tag: 'api' },
    { pattern: '/admin/*', tag: 'protected' },
    { pattern: '/blog/*', tag: 'content' },
  ];

  it('tags matching routes', () => {
    const root = makeNode('', false, [
      makeNode('api', false, [
        makeNode('users', true),
      ]),
      makeNode('blog', false, [
        makeNode('post', true),
      ]),
    ]);
    const result = tagRoutes(root, rules);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ path: '/api/users', tags: ['api'] });
    expect(result[1]).toEqual({ path: '/blog/post', tags: ['content'] });
  });

  it('returns empty when no rules match', () => {
    const root = makeNode('', false, [
      makeNode('about', true),
    ]);
    const result = tagRoutes(root, rules);
    expect(result).toHaveLength(0);
  });

  it('applies multiple tags to a single route', () => {
    const multiRules: TagRule[] = [
      { pattern: '/api/users', tag: 'api' },
      { pattern: '/api/users', tag: 'users' },
    ];
    const root = makeNode('', false, [
      makeNode('api', false, [
        makeNode('users', true),
      ]),
    ]);
    const result = tagRoutes(root, multiRules);
    expect(result[0].tags).toEqual(['api', 'users']);
  });
});

describe('formatTagged', () => {
  it('formats tagged routes', () => {
    const out = formatTagged([{ path: '/api/users', tags: ['api', 'users'] }]);
    expect(out).toContain('/api/users');
    expect(out).toContain('[api, users]');
  });

  it('handles empty list', () => {
    expect(formatTagged([])).toContain('No tagged routes');
  });
});
