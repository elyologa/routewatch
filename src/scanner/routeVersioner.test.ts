import { describe, it, expect } from 'vitest';
import {
  detectVersionFromSegment,
  versionRoutes,
  formatVersionReport,
  VersionReport,
} from './routeVersioner';
import { RouteNode } from './routeScanner';

function makeNode(
  segment: string,
  opts: Partial<RouteNode> = {}
): RouteNode {
  return {
    segment,
    path: segment,
    isDynamic: false,
    isCatchAll: false,
    isGroup: false,
    isPrivate: false,
    hasPage: true,
    hasLayout: false,
    hasLoading: false,
    hasError: false,
    children: [],
    ...opts,
  };
}

describe('detectVersionFromSegment', () => {
  it('detects v1, v2, v10', () => {
    expect(detectVersionFromSegment('v1')).toBe('v1');
    expect(detectVersionFromSegment('v2')).toBe('v2');
    expect(detectVersionFromSegment('v10')).toBe('v10');
  });

  it('returns null for non-version segments', () => {
    expect(detectVersionFromSegment('api')).toBeNull();
    expect(detectVersionFromSegment('users')).toBeNull();
    expect(detectVersionFromSegment('[id]')).toBeNull();
  });
});

describe('versionRoutes', () => {
  it('identifies versioned routes under a version segment', () => {
    const root = makeNode('', {
      hasPage: false,
      children: [
        makeNode('v1', {
          hasPage: false,
          children: [makeNode('users'), makeNode('posts')],
        }),
        makeNode('about'),
      ],
    });

    const report = versionRoutes(root);
    expect(report.versions).toContain('v1');
    expect(report.summary.versioned).toBe(2);
    expect(report.summary.unversioned).toBe(1);
    expect(report.unversioned).toContain('/about');
  });

  it('handles root with no versioned routes', () => {
    const root = makeNode('', {
      hasPage: false,
      children: [makeNode('home'), makeNode('contact')],
    });
    const report = versionRoutes(root);
    expect(report.versions).toHaveLength(0);
    expect(report.summary.unversioned).toBe(2);
  });

  it('collects multiple versions', () => {
    const root = makeNode('', {
      hasPage: false,
      children: [
        makeNode('v1', { hasPage: false, children: [makeNode('orders')] }),
        makeNode('v2', { hasPage: false, children: [makeNode('orders')] }),
      ],
    });
    const report = versionRoutes(root);
    expect(report.versions).toEqual(['v1', 'v2']);
    expect(report.summary.versioned).toBe(2);
  });
});

describe('formatVersionReport', () => {
  it('renders a readable report', () => {
    const root = makeNode('', {
      hasPage: false,
      children: [
        makeNode('v1', { hasPage: false, children: [makeNode('users')] }),
        makeNode('dashboard'),
      ],
    });
    const report = versionRoutes(root);
    const output = formatVersionReport(report);
    expect(output).toContain('v1');
    expect(output).toContain('/dashboard');
    expect(output).toContain('unversioned');
  });
});
