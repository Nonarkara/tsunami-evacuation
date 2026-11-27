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
    assert.deepEqual(links.map(([, path]) => path).sort(), [
      '/data/ddpm-phang-nga-risk-villages-2026-10-28.geojson',
      '/data/hazard-replay.schema.json',
      '/data/rehearsal-routes.json',
      '/data/terrain.json',
    ]);
    const routeLabel = language === 'en' ? 'Routes JSON' : 'เส้นทาง JSON';
    assert.equal([...markup.matchAll(new RegExp(`>${routeLabel}<`, 'g'))].length, 1);
    for (const [, path] of links) {
      const bytes = readFileSync(new URL(`../public${path}`, import.meta.url), 'utf8');
      assert.ok(JSON.parse(bytes));
    }
  }
});
