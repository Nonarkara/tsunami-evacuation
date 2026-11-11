import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TechnicalFiles } from './TechnicalData';

test('the bilingual data directory exposes the public snapshots and their provenance', () => {
  for (const language of ['en', 'th'] as const) {
    const markup = renderToStaticMarkup(createElement(TechnicalFiles, { language }));
    assert.match(markup, language === 'en' ? /Download results CSV/ : /ดาวน์โหลดผล CSV/);
    assert.match(markup, /SSRN.*7270357/);
    assert.match(markup, /href="\/data\/README\.md"/);
    const links = [...markup.matchAll(/href="(\/data\/[^"]+)" download=""/g)];
    assert.equal(links.length, 4);
    for (const [, path] of links) {
      const bytes = readFileSync(new URL(`../public${path}`, import.meta.url), 'utf8');
      assert.ok(JSON.parse(bytes));
    }
  }
});
