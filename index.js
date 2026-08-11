/**
 * astro-llms-txt — an Astro integration that writes a spec-compliant
 * `llms.txt` (https://llmstxt.org) into your build output.
 *
 * It's a thin wrapper around the `llms-txt-generator` package: on
 * `astro:build:done` it resolves your sitemap URL, calls the generator's
 * programmatic API, applies optional include/exclude globs, and writes the
 * result next to your built pages so it deploys with the rest of the site.
 *
 * @typedef {Object} AstroLlmsTxtOptions
 * @property {string} [sitemap]     Explicit sitemap URL. Overrides auto-detection.
 * @property {string} [title]       Site name for the `# H1` (defaults to the host).
 * @property {string} [description] One-line blockquote summary under the H1.
 * @property {string|string[]} [include] Glob(s); keep only page URLs that match.
 * @property {string|string[]} [exclude] Glob(s); drop page URLs that match.
 * @property {string[]|Object<string,string>} [sections] Section passthrough:
 *   an array whitelists section headings (others are dropped); an object
 *   renames headings (`{ "Blog": "Writing" }`).
 * @property {number} [limit=200]   Max pages to include.
 * @property {string} [filename="llms.txt"] Output filename inside the build dir.
 */

import { writeFile } from 'node:fs/promises';
import { resolveSitemapUrl, filterLlmsTxt } from './src/filter.js';

/**
 * @param {AstroLlmsTxtOptions} [options]
 * @returns {import('astro').AstroIntegration}
 */
export default function astroLlmsTxt(options = {}) {
  const {
    sitemap,
    title,
    description,
    include,
    exclude,
    sections,
    limit = 200,
    filename = 'llms.txt',
  } = options;

  let siteUrl;
  let sitemapPresent = false;

  return {
    name: 'astro-llms-txt',
    hooks: {
      'astro:config:done': ({ config }) => {
        siteUrl = config.site;
        sitemapPresent = (config.integrations || []).some(
          (i) => i && i.name === '@astrojs/sitemap'
        );
      },
      'astro:build:done': async ({ dir, pages, logger }) => {
        const log = logger ?? console;
        try {
          const sitemapUrl = resolveSitemapUrl({ sitemap, site: siteUrl, sitemapPresent });
          if (!sitemapUrl) {
            log.warn(
              'No `sitemap` option and no `site` configured — skipping llms.txt. ' +
                'Set `site` in astro.config.mjs (ideally with @astrojs/sitemap) or pass a `sitemap` URL.'
            );
            return;
          }

          // Deferred so the package imports (and tests) without the dependency
          // installed; it is only needed when a build actually runs.
          const { generate } = await import('@nadiamohamed/llms-txt-generator');

          let content = await generate({
            sitemap: sitemapUrl,
            name: title,
            summary: description,
            limit,
          });
          content = filterLlmsTxt(content, { include, exclude, sections });

          const outUrl = new URL(filename, dir);
          await writeFile(outUrl, content, 'utf8');
          log.info(
            `Wrote ${filename} from ${sitemapUrl} (${pages ? pages.length : '?'} routes built).`
          );
        } catch (err) {
          log.warn(`Skipped llms.txt: ${err && err.message ? err.message : err}`);
        }
      },
    },
  };
}
