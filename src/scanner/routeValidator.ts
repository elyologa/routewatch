import * as fs from 'fs';
import * as path from 'path';
import { RouteNode } from '../visualizer/index';

export interface ValidationIssue {
  route: string;
  type: 'missing-page' | 'conflict' | 'invalid-segment';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const VALID_SEGMENT_RE = /^(\(.*\)|\[.*\]|[a-zA-Z0-9_-]+)$/;

export function validateSegment(segment: string): boolean {
  return VALID_SEGMENT_RE.test(segment);
}

export function validateNode(
  node: RouteNode,
  issues: ValidationIssue[] = []
): void {
  const segment = node.segment;

  if (!validateSegment(segment) && segment !== '') {
    issues.push({
      route: node.path,
      type: 'invalid-segment',
      message: `Segment "${segment}" contains invalid characters`,
    });
  }

  const hasPage =
    node.hasPage ||
    node.children.some((c) => c.segment === 'page' || c.hasPage);

  if (!hasPage && node.children.length === 0 && node.path !== '/') {
    issues.push({
      route: node.path,
      type: 'missing-page',
      message: `Route "${node.path}" has no page.tsx`,
    });
  }

  const seen = new Set<string>();
  for (const child of node.children) {
    const key = child.segment.replace(/\[.*?\]/, '[param]');
    if (seen.has(key)) {
      issues.push({
        route: child.path,
        type: 'conflict',
        message: `Conflicting dynamic segments under "${node.path}"`,
      });
    }
    seen.add(key);
    validateNode(child, issues);
  }
}

export function validateRoutes(root: RouteNode): ValidationResult {
  const issues: ValidationIssue[] = [];
  validateNode(root, issues);
  return { valid: issues.length === 0, issues };
}
