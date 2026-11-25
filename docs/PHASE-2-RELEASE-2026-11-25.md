# Soonami Phase 2 release · 25 November 2026

[Public site](https://tsunami.nonarkara.org/) · source `532426a` · Cloudflare version `d19c45fe-bc31-4cf0-91e8-66e23e14e60f`

## Geometry and interaction

- The map starts at y42–44 px under the single 36 px banner. At 1440×900 it uses 786 px of height, up from the 620 px Phase 1 candidate.
- Independent Chromium review found a 60 px caption at 320×700, 390×600 and 667×375 in enlarged Thai. The credit links, Map key and DDPM control were in-frame and hit-testable. The endpoint line reserved the same 23 px before and after Start. The playback controls and first turn stayed visible. The review also checked desktop and tablet geometry.
- Opening Map key paused playback in Thai and English. Escape returned keyboard focus to the trigger and left the clock paused. A pointer drag released the guided camera and paused the clock. Reduced motion kept the camera stationary while the clock advanced. A synthetic visibility transition paused playback and returning to visible left it paused. The automation window did not produce a native tab-hidden transition. [Motion receipt](evidence/phase-2-2026-11-25/motion.json) The frame loop now has a single scheduler with separate callbacks for the clock display, camera and water.
- The Thai Rokehan accessible label was corrected after independent review. Route, terrain and scientific model inputs are unchanged.

## Verification

The exact public build passed Escape smoke in both languages. It also passed the local clipped-caption and desktop map-cap falsifiers, 91 TypeScript tests, 11 Python tests, strict build, six contrast roles, and 40 page-fill cases. Public checks cleared 40 view bounds, 60 banner cases and 28 Results pagination cases in Chromium and WebKit. The live Escape sync audit passed at phone, tablet and desktop. The full live release gate also cleared Results and source dialogs, orchestration, resume and street-linework geometry. All four published receipt sets name the deployed commit and match the files served by the public site. Local and public smoke compared served HTML, entry files, terrain chunks, the worker and data files byte for byte. [Public smoke](evidence/phase-2-2026-11-25/live-smoke.json) · [GitHub Actions](https://github.com/Nonarkara/tsunami-evacuation/actions/runs/45629994135)

## Paired playback measurements

Three alternating runs per build and case used headed Chromium with hardware rendering on the same Mac at 1280×720. Values are medians of per-run p95 frame callback intervals. The reference mirrored the previous public build's checked files.

| Mode | People | Rate | Reference | Release |
| --- | ---: | ---: | ---: | ---: |
| Escape | 1,500 | 1× | 9.9 ms | 9.9 ms |
| Escape | 1,500 | 30× | 17.4 ms | 17.8 ms |
| Escape | 5,000 | 1× | 9.7 ms | 10.1 ms |
| Escape | 5,000 | 30× | 18.1 ms | 24.8 ms |
| Crowd | 1,500 | 1× | 10.0 ms | 10.0 ms |
| Crowd | 1,500 | 30× | 9.6 ms | 9.2 ms |
| Crowd | 5,000 | 1× | 9.1 ms | 9.2 ms |
| Crowd | 5,000 | 30× | 9.2 ms | 9.3 ms |

The heaviest Escape run was slower than the matched reference and met the 33 ms desktop target. Its exercise clock advanced 30.07 exercise seconds per wall second at 30×. Median map ready time was 4.28 s on the reference and 3.92 s on the release, with one release launch at 9.58 s. These results characterize this workstation. [Paired measurements](evidence/phase-2-2026-11-25/paired-playback.json)

## Recovery and remaining evidence

The previous verified Worker version is `e75338e6-e9e7-4368-82b3-e95f58d5eaa4`. Its checked bytes were used in the local reference runs. Physical-phone touch, native Thai reader comprehension, and an HTTP check of a Cloudflare restore preview remain open. [Recovery instructions](DEPLOYMENT.md)
