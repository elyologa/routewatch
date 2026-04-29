import { detectSymmetry, formatSymmetryReport } from './routeSymmetry';
import { RouteNode } from './routeScanner';

function makeNode(segment: string, children: RouteNode[] = []): RouteNode {
  return { segment, children, hasPage: true, hasLayout: false };
}

describe('detectSymmetry', () => {
  it('detects crud pair (new / [id])', () => {
    const root = makeNode('app', [
      makeNode('posts', [
        makeNode('new'),
        makeNode('[id]'),
      ]),
    ]);
    const report = detectSymmetry(root);
    expect(report.pairs.length).toBeGreaterThan(0);
    const pair = report.pairs.find(p => p.type === 'crud');
    expect(pair).toBeDefined();
    expect(pair!.path).toContain('new');
    expect(pair!.mirror).toContain('[id]');
  });

  it('detects versioned pair (v1 / v2)', () => {
    const root = makeNode('app', [
      makeNode('v1', [
        makeNode('users'),
      ]),
      makeNode('v2', [
        makeNode('users'),
      ]),
    ]);
    const report = detectSymmetry(root);
    const pair = report.pairs.find(p => p.type === 'versioned');
    expect(pair).toBeDefined();
    expect(pair!.path).toContain('v1');
    expect(pair!.mirror).toContain('v2');
  });

  it('returns asymmetric routes when no pairs found', () => {
    const root = makeNode('app', [
      makeNode('about'),
      makeNode('contact'),
    ]);
    const report = detectSymmetry(root);
    expect(report.pairs).toHaveLength(0);
    expect(report.asymmetric.length).toBeGreaterThan(0);
  });

  it('counts total routes correctly', () => {
    const root = makeNode('app', [
      makeNode('a'),
      makeNode('b'),
      makeNode('c'),
    ]);
    const report = detectSymmetry(root);
    expect(report.total).toBe(4); // root + 3 children
  });
});

describe('formatSymmetryReport', () => {
  it('includes header and totals', () => {
    const root = makeNode('app', [makeNode('about')]);
    const report = detectSymmetry(root);
    const output = formatSymmetryReport(report);
    expect(output).toContain('Route Symmetry Report');
    expect(output).toContain('Total routes scanned');
  });

  it('shows no pairs message when empty', () => {
    const report = { pairs: [], asymmetric: ['/app'], total: 1 };
    const output = formatSymmetryReport(report);
    expect(output).toContain('No symmetric route pairs detected.');
  });
});
