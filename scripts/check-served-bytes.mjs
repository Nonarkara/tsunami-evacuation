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
 * This check closes that gap. It reads the live origin, hashes the bundles it
 * actually serves, and compares them with the receipt.
 *
 *     node scripts/check-served-bytes.mjs https://tsunami.nonarkara.org
 *
 * It is a release check, not a CI check: it needs the network and the origin.
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const origin = (process.argv[2] || 'https://tsunami.nonarkara.org').replace(/\/+$/, '');
const receiptPath = process.argv[3] || 'docs/evidence/viewport-2026-10-28/capture-receipt.json';

const failures = [];

async function sha256(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url} → ${response.status}`);
  return createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex');
}

let receipt;
try {
  receipt = JSON.parse(readFileSync(receiptPath, 'utf8'));
} catch (error) {
  console.error(`cannot read the receipt ${receiptPath}: ${error.message}`);
  process.exit(1);
}

const html = await (await fetch(`${origin}/`)).text();
const served = [...new Set([...html.matchAll(/assets\/index-[A-Za-z0-9_-]+\.(?:js|css)/g)].map(m => m[0]))].sort();
if (!served.length) {
  console.error(`no bundle names found in ${origin}/`);
  process.exit(1);
}

// The index itself changes with every release by construction, because it names the
// bundles. The hashed assets are what a receipt is really about.
const recorded = new Map((receipt.bytes || [])
  .filter(entry => entry.path.startsWith('/assets/'))
  .map(entry => [entry.path.replace(/^\//, ''), entry.sha256]));

for (const name of served) {
  const live = await sha256(`${origin}/${name}`);
  const was = recorded.get(name);
  if (!was) {
    failures.push(`${name} is served but the receipt does not record it — the receipt is older than this release`);
  } else if (was !== live) {
    failures.push(`${name} is served with different bytes than the receipt records (receipt ${was.slice(0, 12)}, live ${live.slice(0, 12)})`);
  }
}

for (const [name, hash] of recorded) {
  if (!served.includes(name)) failures.push(`the receipt records ${name}, which the site no longer serves`);
}

const capturedAt = receipt.capturedAt || 'unknown';
if (failures.length) {
  console.error(`SERVED_BYTES_FAIL — the receipts do not describe what ${origin} is serving (captured ${capturedAt})`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}
console.log(`SERVED_BYTES_PASS — ${served.length} bundle(s) served by ${origin} match the receipt taken ${capturedAt}`);
console.log(`  receipt commit: ${receipt.commit || 'not recorded (receipt predates the commit field)'}`);
for (const name of served) console.log(`  ${name}`);
