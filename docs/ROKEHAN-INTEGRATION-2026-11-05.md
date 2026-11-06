# Rokehan integration — 5 November 2026

**Asked:** "Better integration with https://tools.oyasumi-gamedev.com/rokehan/#ll=35.659500%2C139.700500&s=100&tod=late&far=4&n=Shibuya+Crossing%2C+Tokyo"

**Release:** `8cd218c` · Cloudflare `f3ffddf4-2dc7-4107-a508-dbee9bce6eb4` · https://tsunami.nonarkara.org

---

## What the browser proved before anything was built

**The tool cannot be framed from this site, and that is its own policy.** The served page
declares:

```
content-security-policy: default-src 'self'; …; frame-ancestors 'self' https://oyasumi-gamedev.com
```

Chrome enforces it. A parent page on another origin, loading the tool's own embed URL
(`?embed=1&render=1`), recorded:

```
error: Framing 'https://tools.oyasumi-gamedev.com/' violates the following Content Security
Policy directive: "frame-ancestors 'self' https://oyasumi-gamedev.com". The request has been blocked.
```

The frame URL became `chrome-error://chromewebdata/`. The tool's embed mode exists for its own
site: `RK_EMBED` is only true when `window.parent !== window`.

Nothing here proxies, mirrors or rewrites that header. A mirror would defeat a protection the
author set deliberately, and the tool's terms forbid redistributing its output.

**The permalink contract, read from the tool's source rather than assumed:**

| Param | Meaning | Unit | Tool's own values |
|-------|---------|------|-------------------|
| `ll` | latitude, longitude | six decimals, comma URL-encoded | from the sourced OSM node |
| `s` | near-area radius | metres | 100 / 200 / 300 / 400 / 600 / 800 / 1000 |
| `far` | surroundings distance | kilometres | 1 / 2 / 4 |
| `tod` | time of day | — | `day` / `dusk` / `night` / `late` |
| `n` | place label | free text | — |

`?lang=th` selects the tool's Thai interface, which it already ships. `tod=day` is dropped
from the hash on load because it is the default; `far` is kilometres on the wire (`far` × 1000
on read, `OPT.far/1000` on write).

---

## Found

- The Rokehan action was a footnote inside a collapsed "Scenario settings, data and coverage"
  disclosure on the drill page. It was invisible in the normal reading path, and it always
  pointed at one fixed scene — `s=100`, `far=4`, `tod=day` — regardless of what the reader was
  looking at or what time it was at that place.
- The source ledger carried R1–R10 and did not include the tool at all, so nothing in the app
  said what the tool was or was not.
- The MSH capture instrument pressed a masthead control for the DDPM surface that the
  masthead no longer carries (that page lives under Research since the ink-scene release), so
  the capture failed before it wrote a receipt. It also navigated by hash alone, which is a
  same-document navigation the application does not listen for — so every surface after the
  first was measured on the wrong page.
- MSH baseline of the live release, 15 surfaces: chrome 36+24/28px (7–8%), gaps 0, stretched
  siblings 0, inflated controls 0, document overflow none.

## Changed

- **`src/scene-reference.ts`** — one module that builds the scene. It carries the app's own
  state: the sourced OSM camera node, the sun at that place mapped onto the tool's four bands
  (`day` ≥ 12°, `dusk` ≥ 0°, `night` ≥ −6°, `late` below), and the camera in use — walk
  100 m/1 km, route 300 m/2 km, overview 600 m/4 km, every value one of the tool's own menu
  entries. It requests the tool's Thai interface when the app reads Thai. It returns null when
  no sourced node exists: the app never guesses a centre.
- **The action moved to the terrain caption**, where the place is being read, and it now
  travels with the camera and the light. The map key states what the scene is and is not and
  carries the camera node as a source link.
- **The buried duplicate is gone** from the settings disclosure.
- **Source ledger R11** — the tool's maker, its inputs, its terms, and the framing refusal.
  The stale masthead hint "sources R1–R8" was corrected.
- **The MSH capture instrument** reaches each surface by a distinct query so the hash is read
  on boot, and presses a masthead control only where one exists.

## Verified

**Local.** `tsc -b --noEmit` clean · 81 tests, 0 failures · production build clean · contrast
all roles AA (body 15.44, secondary 6.55, masthead 11.47, amber navigation 5.94, action text
8.00, active row 13.72) · five gate scripts pass (viewport, banner, manga, orchestration
geometry, resume).

**Layout, measured rather than eyeballed.** The caption band is unchanged at every width —
**52 px at 390×844, 30 px at 1024×768, 30 px at 1440×900**, before and after — with zero
horizontal and vertical document overflow and no console errors. At 1024 the attribution line
moves to the row below, inside a band that already had the room; the link itself stays grouped
with the other caption actions. The map key dialog keeps its bounds (366×796 at 390, 900×561
at 1024 English, 900×502 at 1024 Thai).

**Live.** The served bytes are the built bytes: `index-CmmLBSCg.js` sha256 `778aca68…`,
`index-DI3v0cq7.css` sha256 `b9002e53…`. The action is present in both languages with the
right target — English
`…/rokehan/#ll=8.666894%2C98.252967&s=600&tod=late&far=4&n=Bang+Niang`, Thai
`…/rokehan/?lang=th#ll=…&n=บางเนียง` — band 30 px, no overflow, no console errors.

**The tool, opened from the app's own link.** The permalink opened **Bang Niang**: the tool's
status bar read "near area 600m, surroundings 4km", its time-of-day control read **Late
night**, its camera control read **Overview (whole area)**, and the scene reported "176
buildings (169 guessed heights) · 41 roads · 677 trees · elevation 6 m". 169 of 176 heights
are the tool's guesses — which is precisely why it stays labelled an illustration.

## Remaining

- **The tool is not in the page.** A true embed needs one line changed by the tool's author:
  `frame-ancestors 'self' https://oyasumi-gamedev.com https://tsunami.nonarkara.org`. Until
  then the action opens a new tab. This is the tool's deliberate boundary, not a defect here.
- **The scene is the tool's estimates**, not a survey: guessed heights, no surveyed pavement,
  entrances or accessibility. It says no refuge, no route safety and no water depth.
- **No Rokehan output is embedded or exported in Soonami.** The app's own ink scene
  (`docs/RECOVERY-2026-11-05.md`) is drawn from the app's own published OSM snapshot, not from
  a Rokehan export, so the terms about redistributed exported files do not apply to it.
- **The sun-to-band mapping is approximate.** The tool renders a stylised light; the mapping
  only puts the scene in the same part of the day as the app's own sun indicator.
- **MSH debt not addressed here:** research/guide pagination can still leave spare space at
  indivisible chart boundaries, as the 4 November release recorded. This release added no page,
  no band and no chrome — it moved one action and added one line to a map key.
- The action appears only where a sourced OSM node exists, which today is the Bang Niang
  exercise area. Other places have no scene to open, and the app says nothing rather than
  inventing one.
