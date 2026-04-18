import { validateRoutes, validateSegment, ValidationIssue } from './routeValidator';
import { RouteNode } from '../visualizer/index';

function makeNode(
  segment: string,
  routePath: string,
  hasPage: boolean,
  children: RouteNode[] = []
): RouteNode {
  return { segment, path: routePath, hasPage, children } as RouteNode;
}

describe('validateSegment', () => {
  it('accepts normal segments', () => {
    expect(validateSegment('about')).toBe(true);
    expect(validateSegment('[id]')).toBe(true);
    expect(validateSegment('(group)')).toBe(true);
  });

  it('rejects segments with spaces', () => {
    expect(validateSegment('my page')).toBe(false);
  });
});

describe('validateRoutes', () => {
  it('returns valid for a simple tree with pages', () => {
    const root = makeNode('', '/', true, [
      makeNode('about', '/about', true),
    ]);
    const result = validateRoutes(root);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('detects missing page', () => {
    const root = makeNode('', '/', true, [
      makeNode('about', '/about', false),
    ]);
    const result = validateRoutes(root);
    expect(result.valid).toBe(false);
    expect(result.issues[0].type).toBe('missing-page');
  });

  it('detects invalid segment', () => {
    const root = makeNode('', '/', true, [
      makeNode('my page', '/my page', true),
    ]);
    const result = validateRoutes(root);
    const types = result.issues.map((i: ValidationIssue) => i.type);
    expect(types).toContain('invalid-segment');
  });

  it('detects conflicting dynamic segments', () => {
    const root = makeNode('', '/', true, [
      makeNode('[id]', '/[id]', true),
      makeNode('[slug]', '/[slug]', true),
    ]);
    const result = validateRoutes(root);
    const types = result.issues.map((i: ValidationIssue) => i.type);
    expect(types).toContain('conflict');
  });
});
