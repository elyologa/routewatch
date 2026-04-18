import { annotateSegment, annotateNode, annotateRoutes } from './routeAnnotator';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, isRoute: boolean, children: RouteNode[] = []): RouteNode {
  return { segment, isRoute, children };
}

describe('annotateSegment', () => {
  it('detects dynamic segment', () => {
    expect(annotateSegment('[id]').dynamic).toBe(true);
    expect(annotateSegment('about').dynamic).toBe(false);
  });

  it('detects catch-all segment', () => {
    expect(annotateSegment('[...slug]').catchAll).toBe(true);
    expect(annotateSegment('[id]').catchAll).toBe(false);
  });

  it('detects optional catch-all', () => {
    expect(annotateSegment('[[...slug]]').optional).toBe(true);
  });

  it('detects group segment', () => {
    expect(annotateSegment('(marketing)').group).toBe(true);
    expect(annotateSegment('about').group).toBe(false);
  });

  it('detects parallel route', () => {
    expect(annotateSegment('@modal').parallel).toBe(true);
    expect(annotateSegment('modal').parallel).toBe(false);
  });

  it('detects intercepted route', () => {
    expect(annotateSegment('(.)photo').intercepted).toBe(true);
    expect(annotateSegment('photo').intercepted).toBe(false);
  });
});

describe('annotateRoutes', () => {
  it('returns annotations for all route nodes', () => {
    const tree = makeNode('', false, [
      makeNode('about', true),
      makeNode('[id]', true, [
        makeNode('edit', true),
      ]),
    ]);
    const annotations = annotateRoutes(tree);
    expect(annotations).toHaveLength(3);
    const idAnnotation = annotations.find(a => a.route.includes('[id]'));
    expect(idAnnotation?.dynamic).toBe(true);
  });

  it('tracks depth correctly', () => {
    const tree = makeNode('', false, [
      makeNode('blog', true, [
        makeNode('[slug]', true),
      ]),
    ]);
    const annotations = annotateRoutes(tree);
    const slug = annotations.find(a => a.route.includes('[slug]'));
    expect(slug?.depth).toBe(2);
  });
});
