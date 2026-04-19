import { computeChangelog, formatChangelog } from './routeChangelog';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  hasPage: boolean,
  children: RouteNode[] = []
): RouteNode {
  return { segment, hasPage, children, path: segment };
}

describe('computeChangelog', () => {
  it('detects added routes', () => {
    const prev = makeNode('', false, [makeNode('about', true)]);
    const curr = makeNode('', false, [
      makeNode('about', true),
      makeNode('contact', true),
    ]);
    const log = computeChangelog(prev, curr);
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].status).toBe('added');
    expect(log.entries[0].path).toContain('contact');
  });

  it('detects removed routes', () => {
    const prev = makeNode('', false, [
      makeNode('about', true),
      makeNode('old', true),
    ]);
    const curr = makeNode('', false, [makeNode('about', true)]);
    const log = computeChangelog(prev, curr);
    expect(log.entries).toHaveLength(1);
    expect(log.entries[0].status).toBe('removed');
  });

  it('returns empty entries when no changes', () => {
    const node = makeNode('', false, [makeNode('home', true)]);
    const log = computeChangelog(node, node);
    expect(log.entries).toHaveLength(0);
  });
});

describe('formatChangelog', () => {
  it('shows no changes message', () => {
    const log = { generatedAt: '', entries: [] };
    expect(formatChangelog(log)).toBe('No route changes detected.');
  });

  it('formats added and removed', () => {
    const log = computeChangelog(
      makeNode('', false, [makeNode('a', true)]),
      makeNode('', false, [makeNode('b', true)])
    );
    const out = formatChangelog(log);
    expect(out).toContain('[+]');
    expect(out).toContain('[-]');
  });
});
