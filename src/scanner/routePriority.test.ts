import { getLevel, getPriority, prioritizeRoutes, formatPriorities } from './routePriority';
import { RouteNode } from '../types';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, path: segment };
}

describe('getLevel', () => {
  it('identifies static segments', () => {
    expect(getLevel('about')).toBe('static');
  });
  it('identifies dynamic segments', () => {
    expect(getLevel('[id]')).toBe('dynamic');
  });
  it('identifies catch-all segments', () => {
    expect(getLevel('[...slug]')).toBe('catch-all');
  });
  it('identifies optional catch-all segments', () => {
    expect(getLevel('[[...slug]]')).toBe('optional-catch-all');
  });
});

describe('getPriority', () => {
  it('returns highest priority for static', () => {
    expect(getPriority('static')).toBe(3);
  });
  it('returns lowest priority for optional-catch-all', () => {
    expect(getPriority('optional-catch-all')).toBe(0);
  });
});

describe('prioritizeRoutes', () => {
  it('sorts routes by priority descending', () => {
    const root = makeNode('', [
      makeNode('[...slug]'),
      makeNode('about'),
      makeNode('[id]'),
    ]);
    const result = prioritizeRoutes(root);
    const levels = result.map(r => r.level);
    expect(levels.indexOf('static')).toBeLessThan(levels.indexOf('dynamic'));
    expect(levels.indexOf('dynamic')).toBeLessThan(levels.indexOf('catch-all'));
  });
});

describe('formatPriorities', () => {
  it('includes header and route info', () => {
    const routes = [{ path: '/about', priority: 3, level: 'static' as const }];
    const output = formatPriorities(routes);
    expect(output).toContain('Route Priorities');
    expect(output).toContain('/about');
    expect(output).toContain('static');
  });
});
