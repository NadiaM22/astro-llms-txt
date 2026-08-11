/**
 * Pure, dependency-free helpers for astro-llms-txt.
 *
 * These are kept separate from the integration so they can be unit-tested
 * without a build, a network call, or the `llms-txt-generator` dependency.
 */

/** Resolve the sitemap URL to feed the generator. */
export function resolveSitemapUrl({ sitemap, site, sitemapPresent }) {
  if (sitemap) return String(sitemap);
  if (!site) return null;
  const file = sitemapPresent ? 'sitemap-index.xml' : 'sitemap.xml';
  return new URL(file, site).href;
}

function asArray(v) {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * Minimal glob → RegExp. `*`/`**` match any run of characters, `?` matches one.
 * Sufficient for filtering absolute page URLs (e.g. `https://x.com/blog/*`).
 */
export function globToRegExp(glob) {
  const source = String(glob)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*+/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp('^' + source + '$');
}

/** Drop the empty `## Section` headers left behind after bullet filtering. */
function pruneEmptySections(lines) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^## /.test(lines[i])) {
      let hasBullet = false;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^## /.test(lines[j])) break;
        if (/^- /.test(lines[j])) {
          hasBullet = true;
          break;
        }
      }
      if (!hasBullet) continue; // skip the orphaned header
    }
    out.push(lines[i]);
  }
  return out;
}

/**
 * Filter a generated llms.txt document by include/exclude URL globs and an
 * optional `sections` whitelist/rename map. Headers and prose are preserved;
 * only `- [label](url)` bullets are filtered, and empty sections are pruned.
 *
 * @param {string} content
 * @param {{include?: string|string[], exclude?: string|string[], sections?: string[]|Object<string,string>}} [opts]
 * @returns {string}
 */
export function filterLlmsTxt(content, opts = {}) {
  const { include, exclude, sections } = opts;
  const inc = asArray(include).map(globToRegExp);
  const exc = asArray(exclude).map(globToRegExp);
  const bulletUrl = /^- \[[^\]]*\]\(([^)]+)\)/;

  const keepUrl = (url) => {
    if (exc.some((re) => re.test(url))) return false;
    if (inc.length && !inc.some((re) => re.test(url))) return false;
    return true;
  };

  const sectionAllow = Array.isArray(sections)
    ? new Set(sections.map((s) => String(s).toLowerCase()))
    : null;
  const sectionRename =
    sections && !Array.isArray(sections) && typeof sections === 'object' ? sections : null;

  const out = [];
  let currentAllowed = true;

  for (const line of content.split('\n')) {
    const h2 = line.match(/^## (.+)$/);
    if (h2) {
      const name = h2[1];
      currentAllowed = sectionAllow ? sectionAllow.has(name.toLowerCase()) : true;
      if (currentAllowed) {
        out.push(`## ${sectionRename && sectionRename[name] ? sectionRename[name] : name}`);
      }
      continue;
    }

    const bm = line.match(bulletUrl);
    if (bm) {
      if (currentAllowed && keepUrl(bm[1])) out.push(line);
      continue;
    }

    if (currentAllowed) out.push(line);
  }

  return (
    pruneEmptySections(out)
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trimEnd() + '\n'
  );
}
