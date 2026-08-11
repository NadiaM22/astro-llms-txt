<h1 align="center">astro-llms-txt</h1>

<p align="center">
  <b>Generate a spec-compliant <code>llms.txt</code> for your Astro site at build time.</b><br/>
  <i>An Astro integration wrapper around <a href="https://github.com/NadiaM22/llms-txt-generator">llms-txt-generator</a>.</i>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-3c873a?style=flat-square" alt="node >=18"/>
  <img src="https://img.shields.io/badge/astro-integration-ff5d01?style=flat-square" alt="astro integration"/>
  <img src="https://img.shields.io/badge/license-MIT-2563eb?style=flat-square" alt="MIT"/>
</p>

---

> 📖 **Docs & full guide:** [How to implement an llms.txt file for SaaS SEO](https://nadiamohamed.me/insights/llms-txt-file-seo-saas-implementation/)
> Built by [Nadia Mohamed](https://nadiamohamed.me) — SEO Engineer · Technical SEO + GEO for SaaS.
> Try the free companion tools at [nadiamohamed.me/ai-tools](https://nadiamohamed.me/ai-tools/).

[`llms.txt`](https://llmstxt.org) is a single Markdown file at the root of your site that gives large language models a concise, curated index of your most important pages — `robots.txt`, but for *comprehension* instead of *permission*.

**astro-llms-txt** builds that file as part of your Astro build. It wraps the zero-dependency [`llms-txt-generator`](https://github.com/NadiaM22/llms-txt-generator) and drops an `llms.txt` straight into your build output, so it ships with every deploy.

## Install

```bash
npm install @nadiamohamed/astro-llms-txt
```

## Usage

Add the integration to your `astro.config.mjs`. It works best alongside [`@astrojs/sitemap`](https://docs.astro.build/en/guides/integrations-guide/sitemap/) — set `site` so absolute URLs can be resolved:

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import llmsTxt from '@nadiamohamed/astro-llms-txt';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    sitemap(),
    llmsTxt({
      title: 'Example',
      description: 'Product docs, guides, and engineering write-ups.',
    }),
  ],
});
```

Run `astro build` and you'll find `llms.txt` in your output directory (`dist/` by default).

## Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | site host | Site name for the `# H1`. |
| `description` | `string` | — | One-line blockquote summary under the H1. |
| `sitemap` | `string` | auto | Explicit sitemap URL. Overrides auto-detection. |
| `include` | `string \| string[]` | — | Glob(s); keep only page URLs that match. |
| `exclude` | `string \| string[]` | — | Glob(s); drop page URLs that match (e.g. `**/drafts/**`). |
| `sections` | `string[] \| Record<string,string>` | — | Array whitelists section headings; object renames them (`{ Blog: 'Writing' }`). |
| `limit` | `number` | `200` | Max pages to include. |
| `filename` | `string` | `"llms.txt"` | Output filename inside the build directory. |

## How it works

On the `astro:build:done` hook the integration:

1. Resolves a sitemap URL — your `sitemap` option if given, otherwise `sitemap-index.xml` (when `@astrojs/sitemap` is detected) or `sitemap.xml`, relative to your configured `site`.
2. Calls `llms-txt-generator`'s programmatic `generate()` API to read the sitemap and fetch each page's title and description.
3. Applies your `include`/`exclude` globs and `sections` whitelist/rename, pruning any section left empty.
4. Writes the result to `<build output>/llms.txt`.

Because generation reads your **published** sitemap, `llms.txt` reflects the sitemap that is live when the build runs — run the build after your sitemap is deployed, or point `sitemap` at a staging URL. Everything is zero-dependency, ESM, and Node ≥ 18.

## Part of the GEO toolkit

Open-source tools I maintain for AI-search visibility:

- [llms-txt-generator](https://github.com/NadiaM22/llms-txt-generator) — spec-compliant `/llms.txt` from any sitemap
- [geo-audit-cli](https://github.com/NadiaM22/geo-audit-cli) — score any URL on AI-search readiness
- [ai-referral-tracker](https://github.com/NadiaM22/ai-referral-tracker) — isolate ChatGPT/Perplexity/Gemini traffic in GA4 & logs
- [json-ld-schema-templates-seo](https://github.com/NadiaM22/json-ld-schema-templates-seo) — production JSON-LD templates optimized for AI citation
- [awesome-generative-engine-optimization](https://github.com/NadiaM22/awesome-generative-engine-optimization) — curated GEO resources

Web-based versions (no install): [AEO Analyzer, Keyword Clustering & more →](https://nadiamohamed.me/ai-tools/)

## License

MIT © [Nadia Mohamed](https://nadiamohamed.me) — SEO Engineer, Technical SEO + GEO for SaaS & tech.
