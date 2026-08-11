import { test } from 'node:test';
import assert from 'node:assert/strict';

import astroLlmsTxt from '../index.js';
import { resolveSitemapUrl, filterLlmsTxt, globToRegExp } from '../src/filter.js';

// A fixture "routes list" as it would appear in a generated llms.txt after the
// generator has walked the sitemap for a small site.
const FIXTURE = `# Example

> Docs and guides.

## Blog

- [How to Get Cited by Perplexity](https://example.com/blog/perplexity): AI-search visibility.
- [Draft: unfinished](https://example.com/blog/draft-secret): work in progress.

## Docs

- [Getting Started](https://example.com/docs/start): Install in five minutes.
`;

test('integration factory returns a well-formed Astro integration', () => {
  const integration = astroLlmsTxt({ title: 'Example' });
  assert.equal(integration.name, 'astro-llms-txt');
  assert.equal(typeof integration.hooks['astro:config:done'], 'function');
  assert.equal(typeof integration.hooks['astro:build:done'], 'function');
});

test('astro:config:done detects @astrojs/sitemap and picks the index sitemap', () => {
  const integration = astroLlmsTxt();
  integration.hooks['astro:config:done']({
    config: { site: 'https://example.com', integrations: [{ name: '@astrojs/sitemap' }] },
  });
  // No sitemap override + site + @astrojs/sitemap => sitemap-index.xml
  assert.equal(
    resolveSitemapUrl({ site: 'https://example.com', sitemapPresent: true }),
    'https://example.com/sitemap-index.xml'
  );
  assert.equal(
    resolveSitemapUrl({ site: 'https://example.com', sitemapPresent: false }),
    'https://example.com/sitemap.xml'
  );
  assert.equal(resolveSitemapUrl({ site: undefined }), null);
  assert.equal(
    resolveSitemapUrl({ sitemap: 'https://x.com/custom.xml', site: 'https://example.com' }),
    'https://x.com/custom.xml'
  );
});

test('globToRegExp matches URL globs', () => {
  assert.ok(globToRegExp('https://example.com/blog/*').test('https://example.com/blog/x'));
  assert.ok(!globToRegExp('https://example.com/blog/*').test('https://example.com/docs/x'));
  assert.ok(globToRegExp('**/draft-*').test('https://example.com/blog/draft-secret'));
});

test('filterLlmsTxt drops excluded URLs and prunes empty sections', () => {
  const out = filterLlmsTxt(FIXTURE, { exclude: '**/draft-*' });
  assert.ok(!out.includes('draft-secret'), 'excluded draft URL removed');
  assert.ok(out.includes('/blog/perplexity'), 'kept blog post');
  assert.ok(out.includes('## Blog'), 'Blog section retained (still has a bullet)');
});

test('filterLlmsTxt include keeps only matching URLs and prunes emptied sections', () => {
  const out = filterLlmsTxt(FIXTURE, { include: 'https://example.com/docs/*' });
  assert.ok(out.includes('/docs/start'), 'kept docs page');
  assert.ok(!out.includes('/blog/'), 'blog URLs filtered out');
  assert.ok(!out.includes('## Blog'), 'emptied Blog section pruned');
  assert.ok(out.includes('## Docs'), 'Docs section retained');
});

test('filterLlmsTxt sections whitelist keeps only named sections', () => {
  const out = filterLlmsTxt(FIXTURE, { sections: ['Docs'] });
  assert.ok(out.includes('## Docs'));
  assert.ok(!out.includes('## Blog'));
});

test('filterLlmsTxt sections rename relabels a heading', () => {
  const out = filterLlmsTxt(FIXTURE, { sections: { Blog: 'Writing' } });
  assert.ok(out.includes('## Writing'));
  assert.ok(!out.includes('## Blog'));
});
