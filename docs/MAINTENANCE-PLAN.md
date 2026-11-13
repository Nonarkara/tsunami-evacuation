# Soonami: security state and long-term maintenance plan

2026-11-13. Written after Codex's release report. I checked it, and a separate security agent (Sonnet) reviewed the code without seeing my findings.

## What Codex reported, and what I found

- **Accurate:** all gates pass, there are no secrets, no `innerHTML`/`eval`, and CSP is in place.
- **Missed by Codex:** there was no HSTS, no COOP, and no long cache on hashed assets. CSP allowed three image hosts the app never uses. CI had no audit step and no Dependabot. `scripts/classify-roofs.py` wrote every thread's arguments to one fixed `/tmp` path. That is a race between its own worker threads, and the path can be replaced with a symlink. The map key had glued text ("at1×", "requesting2pixels").

## Fixed in this pass

| Area | Change |
|---|---|
| Headers | `Strict-Transport-Security: max-age=31536000`, `Cross-Origin-Opener-Policy: same-origin`, `upgrade-insecure-requests` |
| CSP | `img-src` trimmed to `self data: blob: server.arcgisonline.com`. The built bundle references no other image host. |
| Cache | `/assets/*` is `immutable` for one year. File names are content-hashed, so this is safe, and repeat visits on slow coastal connections load faster. |
| CI | `npm audit --audit-level=high` runs before the tests |
| Supply chain | `.github/dependabot.yml`: weekly npm updates (minor and patch grouped), monthly GitHub Actions updates |
| Deps | `npm update` within declared ranges (maplibre 6.18, vite 7.3.8, wrangler 4.161 and others). 0 vulnerabilities. |
| Script | `classify-roofs.py` now uses a private `NamedTemporaryFile` for each call |
| Honesty | The DDPM panel shows "Re-review overdue" once today is past the snapshot's `validUntil` (2027-04-28) |
| Copy | The map key spaces numbers correctly in English and Thai |

## Kept as-is, with reasons

- **`style-src 'unsafe-inline'`**: MapLibre and React inline styles need it. Scripts stay `'self'` only.
- **`connect-src https://s3.amazonaws.com`**: CSP cannot narrow this to the `elevation-tiles-prod` bucket. Closing it means proxying the DEM tiles same-origin, which is a Worker change for little gain while the app has no XSS sink.
- **Actions pinned by tag rather than SHA**: Dependabot now keeps them current. Pin by SHA if the repo ever takes outside contributors.
- **Household plan stored in plaintext `localStorage`**: it is validated on read, never sent anywhere, and the UI says so. This is the intended design.

## Recurring checks

| When | Check | Command or place |
|---|---|---|
| Every push | tests, type check, build, contrast, `npm audit` | `.github/workflows/ci.yml` |
| Weekly | merge Dependabot PRs once CI is green | GitHub |
| Every deploy | live asset hash matches `dist`; no CSP errors in the console on the map, Model and Results views | `npm run deploy`, then the browser pane |
| Quarterly | `npm outdated`; review the CSP host list against `grep -oE 'https://[^"]+' dist/assets/*.js` | shell |
| 2027-04-28 | re-review the DDPM village snapshot. The panel flags it after this date. | `scripts/fetch-ddpm-risk-villages.py` |
| Whenever a source updates | refresh OSM buildings and roofs (all `retrievedAt` dates are 2026-10-27) | `scripts/collect-buildings.py`, `prepare-buildings.py` |

## Planned upgrades (not done, with triggers)

1. **Major versions: Vite 8, TypeScript 7, `@vitejs/plugin-react` 6.** Upgrade one at a time on a branch with full gates. Trigger: a security advisory, or the current majors leaving support.
2. **Bundle split.** `index-*.js` is 1.8 MB because three.js, the 3D model and maps are all in the first load. Lazy-load the 3D scene and the rehearsal view. Trigger: a measured slow first paint on a mid-range phone.
3. **Evidence bloat.** `docs/evidence` holds 605 tracked PNGs (61 MB, most of `.git`'s 71 MB). From now on, keep only the latest run of each audit in git and move older runs to an external archive. Do not rewrite history.
4. **Open from the last audit:** a ~180 px gap on the Thai phone Results page in Safari only, and a physical-phone touch test. Both need a real iPhone or full Xcode.

## Outside the repo

`../tsunami-deploy.tar.gz` (27 Oct) and `../outputs/` are stale artifacts outside git. They are safe to delete once the owner confirms they are not needed.
