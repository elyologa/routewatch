import { RouteNode } from './routeScanner';

export interface TagRule {
  pattern: string;
  tag: string;
}

export interface TaggedRoute {
  path: string;
  tags: string[];
}

function buildPath(node: RouteNode, parent = ''): string {
  return parent ? `${parent}/${node.segment}` : `/${node.segment}`;
}

function matchesPattern(path: string, pattern: string): boolean {
  const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
  return regex.test(path);
}

function collectTags(node: RouteNode, rules: TagRule[], parentPath = ''): TaggedRoute[] {
  const path = node.segment === '' ? '/' : buildPath(node, parentPath === '/' ? '' : parentPath);
  const tags = rules
    .filter(r => matchesPattern(path, r.pattern))
    .map(r => r.tag);

  const results: TaggedRoute[] = [];
  if (node.isRoute && tags.length > 0) {
    results.push({ path, tags });
  }

  for (const child of node.children) {
    results.push(...collectTags(child, rules, path));
  }
  return results;
}

export function tagRoutes(root: RouteNode, rules: TagRule[]): TaggedRoute[] {
  return collectTags(root, rules);
}

export function formatTagged(tagged: TaggedRoute[]): string {
  if (tagged.length === 0) return 'No tagged routes found.\n';
  return tagged
    .map(t => `${t.path}  [${t.tags.join(', ')}]`)
    .join('\n') + '\n';
}
