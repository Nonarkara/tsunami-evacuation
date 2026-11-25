# Hosting and domain

The public application is prepared for the canonical hostname https://tsunami.nonarkara.org/ with Cloudflare Workers Static Assets. `wrangler.jsonc` carries its custom-domain declaration. The existing authenticated Cloudflare account can attach Worker custom domains; no hand-created DNS credential is stored in this repository.

## Release and recovery

Install the browser harness once per environment alongside the locked Node dependencies.

```sh
npm ci
python3 -m venv .venv-smoke
. .venv-smoke/bin/activate
python -m pip install playwright==1.60.0
python -m playwright install chromium webkit
npm run preflight
```

Preflight builds the production site, checks contrast and exercises Escape in a local Chromium session. Thai phone and English desktop both require an in-frame Start and first turn, the eye camera and a working Start action. The receipt in `output/release-smoke.json` records the served file hashes, scene, language and viewport. Run `npm run smoke:release -- --falsify` after a build to prove the check rejects deliberate camera, hidden cue and stale hash failures. Software-rendered browser smoke checks remain separate from device frame pacing. On a Mac running other graphics workloads, set `SOONAMI_SMOKE_HEADED=1` for `preflight` or `release` to use the GPU for supported browser checks.

After committing the source and authenticating Wrangler, use `npm run release` (also available as `npm run deploy`). It runs preflight and page geometry, records the current Cloudflare deployment in `output/previous-deployment.json`, publishes, then checks real interactions and hashes on the public origin. It refreshes the viewport, Results and terrain receipts and checks pagination. GitHub Actions runs the local smoke without Cloudflare credentials.

The last verified pre-scope version on 25 November 2026 was `2535e091-ead4-4dd3-a1f6-20702769f5e1`. Source `b91e4fe` builds its HTML and assets. The Cloudflare restore preview accepted those assets, and the same build passed Escape smoke locally and at the canonical host. The preview API returned no public URL, so verification did not reach that preview over HTTP.

If a public check fails, inspect its named step and the version in `output/previous-deployment.json`. If recovery is needed, run `npx wrangler rollback <version-id>`. Confirm the selected version with `npx wrangler deployments status`. Build the matching source in a separate checkout and run the public smoke against its `dist` to verify the restored release. [Cloudflare rollback documentation](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## Sites publishing history

A public Sites version was also published successfully at https://khao-lak-tsunami.nonsmartcity.chatgpt.site/ . Version 1 corresponds to commit 817950f76b4ba65f9acdb7c93f1affedf1f2237e. Its source and archive were synchronized with the supported Sites workflow. The attempted Sites custom-domain registration required two DNS verification TXT records and a CNAME. The existing Wrangler OAuth session has no DNS-edit scope. The pending Sites custom-domain registration was removed, then the canonical hostname was assigned through Cloudflare's native Worker custom-domain mechanism instead. No DNS records for another service were removed or overwritten.

The Sites URL is an initial published snapshot; the canonical Worker is the deployment target for future releases. Do not silently treat Sites as auto-synchronized after a GitHub push. The GitHub Actions workflow validates source; deployment currently requires the operator release command above.

## Access and data

The site is public by the owner's go-live instruction. Static hosting contains no paid API credential, account workflow, survey respondent data or uploaded personal plans. Local form entries remain in the visitor's browser.

Final deployed Worker version and live-response verification are appended after deployment succeeds.

## Verified canonical release

Deployed source commit: c4c6550a76420a69edbc4ad9e49ee918b99b9fd3. Cloudflare Worker version: ef66af4d-a07a-4bd5-b159-ebe68095fc0a. Deployment completed 27 October 2026, about 18:11 Bangkok time.

Update release (System audit & visualization upgrade): source commit: 9c52c6d. Cloudflare Worker version: 631461b6-7f06-467d-a663-dace506d67fc. Deployment completed 27 October 2026, about 19:44 Bangkok time. Verified live HTTP 200 and exact hashes `index-DnWXaS7a.js` and `index-BZl-uiY-.css` via curl.

Public DNS at 1.1.1.1 and the default resolver returns Cloudflare addresses. HTTPS at the exact canonical hostname returns 200 with normal certificate verification. HTML, JavaScript and CSS bytes match the local production build exactly. The page serves its CSP and nosniff headers; /.DS_Store and an unknown path both return 404. The first HTTPS byte check used curl --resolve with a publicly resolved address because the OS initially cached the pre-deployment NXDOMAIN response; certificate validation remained enabled. A browser navigation initially encountered the same local negative DNS cache, so that initial attempt alone did not establish browser-level canonical verification.

GitHub CI for this source completed successfully: https://github.com/Nonarkara/tsunami-evacuation/actions/runs/40494152265 . Browser flows had already been exercised on the identical application build locally; the final hostname is separately checked as above.

A public browser check also confirmed the deployed Sites snapshot's scenario controls and all visible map tiles. The live source snapshot and canonical build's application asset hashes are identical. The canonical hostname's normal system-resolver request still had local NXDOMAIN caching at closeout, while `dig` through the default resolver and 1.1.1.1 returned its new addresses. No system DNS settings were changed and no TLS warnings were bypassed.

## Terrain and crowd release —27 October2026

Application commit `817e47319fa8d3a8096a0c9451bd54861761aac7`; Worker version `1cdfa078-1312-4769-8855-8baa6d05bfe6`. Published with `npm run deploy` after tests/build/contrast checks. Exact canonical HTML, all JS/CSS/worker assets and both data snapshots matched local production bytes. Real browser terrain, fly-by, crowd playback and water screening worked under the deployed CSP; eight live core geometry cases passed. Full receipts: [terrain verification](TERRAIN-VERIFICATION.md). Sites remains the initial snapshot.

Guided rehearsal release: source `17ad580`, Worker `87a82993-389b-46f2-acbc-e1739bddd6d9`. Canonical HTML/JS/CSS/worker/schema/data matched production bytes; real browser verified walk, 2D, playback and illustrative water. [Receipt and limits](GUIDED-REHEARSAL.md).

Bilingual research release28October2026: application `21a3343` plus font-license `fb50115`, Worker `7634b2b2-974f-47f7-955a-18062a56d4a7`. Verified canonical Thai/English content, four layout cases, Thai fonts and production asset bytes. [Detailed receipt](BILINGUAL-RESEARCH.md).
