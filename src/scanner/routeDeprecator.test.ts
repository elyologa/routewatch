import { collectDeprecated, formatDeprecated, DeprecationRule } from './routeDeprecator';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, path: segment };
}

const tree = makeNode('', [
  makeNode('about'),
  makeNode('blog', [
    makeNode('[slug]'),
  ]),
  makeNode('legacy', [
    makeNode('old-page'),
  ]),
]);

describe('collectDeprecated', () => {
  it('returns empty when no rules match', () => {
    const rules: DeprecationRule[] = [{ pattern: '/nonexistent' }];
    expect(collectDeprecated(tree, rules)).toHaveLength(0);
  });

  it('matches exact path', () => {
    const rules: DeprecationRule[] = [{ pattern: '//legacy/old-page', reason: 'Removed' }];
    const results = collectDeprecated(tree, rules);
    expect(results.some(r => r.path.includes('old-page'))).toBe(true);
  });

  it('includes reason and since', () => {
    const rules: DeprecationRule[] = [{ pattern: '//about', reason: 'Merged', since: '2.0' }];
    const results = collectDeprecated(tree, rules);
    const match = results.find(r => r.path.includes('about'));
    expect(match?.reason).toBe('Merged');
    expect(match?.since).toBe('2.0');
  });

  it('applies wildcard pattern', () => {
    const rules: DeprecationRule[] = [{ pattern: '//legacy/*' }];
    const results = collectDeprecated(tree, rules);
    expect(results.some(r => r.path.includes('old-page'))).toBe(true);
  });
});

describe('formatDeprecated', () => {
  it('returns message when empty', () => {
    expect(formatDeprecated([])).toBe('No deprecated routes found.');
  });

  it('formats entries', () => {
    const out = formatDeprecated([{ path: '/old', reason: 'Gone', since: '1.0' }]);
    expect(out).toContain('/old');
    expect(out).toContain('Gone');
    expect(out).toContain('since 1.0');
  });
});
