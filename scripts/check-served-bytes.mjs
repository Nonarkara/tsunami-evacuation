#!/usr/bin/env node
/**
 * Prove the evidence receipts describe the bytes the host is serving now.
 *
 * The gates in this folder read receipts. A receipt is evidence for the bundle it
 * was taken against, and it carries the sha256 of that bundle for exactly this
 * reason. On 13 November 2026 the viewport and banner gates both reported PASS
 * against a receipt taken on 7 November, while the site was serving a bundle five
 * releases newer: a green gate proving nothing.
 *
 * The same fault was found in the playback evidence: its receipt records the
 * bundle `index-DG2lLEsn.js` from commit `c47b077`, and nothing had re-measured
 * the Results layout since, so `check-playback-data-evidence.mjs` was asserting a
 * layout that no longer existed. A receipt without a producer is a receipt that
 * cannot be refreshed.
 *
 * This check closes that gap for every receipt that records bytes. It reads the
 * live origin, hashes the bundles and data files it actually serves, and compares
 * them with the receipts.
 *
 *     node scripts/check-served-bytes.mjs https://tsunami.nonarkara.org
 *
 * It is a release check, not a CI check: it needs the network and the origin.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const origin = (process.argv[2] || 'https://tsunami.nonarkara.org').replace(/\/+$/, '');

// Every receipt that records the bytes it was taken against.
const RECEIPTS = [
  {
    name: 'viewport/banner capture',
    path: 'docs/evidence/viewport-2026-10-28/capture-receipt.json',
    list: (receipt) => receipt.bytes || [],
  },
  {
    name: 'playback geometry capture',
    path: 'docs/evidence/playback-data-2026-11-12/live-assets.json',
    list: (receipt) => receipt.receipts || [],
  },
];

const failures = [];
const notes = [];

async function sha256(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
}

const html = await (await fetch(`${origin}/`)).text();
const served = [...new Set([...html.matchAll(/assets\/index-[A-Za-z0-9_-]+\.(?:js|css)/g)].map(m => m[0]))].sort();
if (!served.length) {
  console.error(`no bundle names found in ${origin}/`);
  process.exit(1);
}

// The data files are part of the release: the app fetches them at runtime, so a
// receipt that measured the interface against one set of data says nothing about
// the interface against another.
const DATA_FILES = [
  '/data/rehearsal-routes.json',
  '/data/terrain.json',
  '/data/hazard-replay.schema.json',
  '/data/ddpm-phang-nga-risk-villages-2026-10-28.geojson',
];

for (const receipt of RECEIPTS) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(receipt.path, 'utf8'));
  } catch (error) {
    failures.push(`cannot read ${receipt.path}: ${error.message}`);
    continue;
  }
  const recorded = new Map(
    receipt.list(parsed)
      .filter(entry => entry.path && entry.path !== '/' && entry.sha256)
      .map(entry => [entry.path.replace(/^\//, ''), entry.sha256])
  );
  if (!recorded.size) {
    failures.push(`${receipt.path} records no bytes — it cannot prove anything`);
    continue;
  }

  for (const name of served) {
    const live = await sha256(`${origin}/${name}`);
    const was = recorded.get(name);
    if (!was) {
      failures.push(`${receipt.name}: ${name} is served but the receipt does not record it — the receipt is older than this release`);
    } else if (was !== live) {
      failures.push(`${receipt.name}: ${name} is served with different bytes than the receipt records (receipt ${was.slice(0, 12)}, live ${live.slice(0, 12)})`);
    }
  }

  for (const [name, hash] of recorded) {
    if (name.startsWith('assets/') && !served.includes(name)) {
      failures.push(`${receipt.name}: the receipt records ${name}, which the site no longer serves`);
    }
    if (name.startsWith('data/')) {
      const live = await sha256(`${origin}/${name}`);
      if (live !== hash) {
        failures.push(`${receipt.name}: ${name} is served with different bytes than the receipt records (receipt ${hash.slice(0, 12)}, live ${live.slice(0, 12)})`);
      }
    }
  }

  notes.push(`${receipt.name}: receipt from ${parsed.capturedAt || 'unknown date'}, commit ${parsed.commit || 'not recorded'}`);
}

// Every data file must be served at all, or the receipts above are describing a
// release that no longer carries its own inputs.
for (const path of DATA_FILES) {
  try {
    const response = await fetch(`${origin}${path}`);
    if (!response.ok) failures.push(`${path} is not served (${response.status})`);
  } catch (error) {
    failures.push(`${path} could not be fetched: ${error.message}`);
  }
}

if (failures.length) {
  console.error(`SERVED_BYTES_FAIL — the receipts do not describe what ${origin} is serving`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`SERVED_BYTES_PASS — ${served.length} bundle(s) served by ${origin} match every receipt`);
for (const note of notes) console.log(`  ${note}`);
for (const name of served) console.log(`  ${name}`);
