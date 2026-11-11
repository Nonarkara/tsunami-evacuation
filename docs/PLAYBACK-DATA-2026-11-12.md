# Rehearsal playback and technical files

The reported local commits were already on origin/main at fdb9f80 when this session began. The live HTML referenced the reported index-D7favUGC.js and index-CWYX4XSF.css. No PR or uncommitted work needed reconciliation. Live Escape rendered the endpoint countdown after Start.

The layout uses columns. The map leads the rehearsal, followed by the turn cue and controls. Results opens with the outcome, with the two-condition comparison beside it at desktop widths. Package details follow the chart. Timing and Data & sources stay with the Results heading as readers turn pages.

The follow camera samples the existing walker schedule on animation frames. The clock and crowd readings publish at intervals of at least 50 ms, and water geometry and its level share a sample at intervals of at least 200 ms. Pause and seek synchronize the clock, camera and water. Delays beyond 250 ms are discarded. Manual input, dialogs, view changes, document hiding and graphics context loss stop playback. Automatic camera following honors reduced motion. Route arrows and maximum waits are cached by route or scenario, while current queue counts still come from the live model frame. The choke-point action uses the selected walker’s route.

Results previously clipped the lower chart and package controls at 1440×900. The padding change was overridden by the viewport stylesheet. The comparison now has a 160 px desktop plot and a 96 px narrow plot. The legend, plot and controls move together in the narrow reader. At 390×600 the first page holds the outcome and full comparison in both languages. Short landscape uses three pages, and the package guidance can span pages two and three.

Data & sources opens on Results and Research. The terrain source dialog also provides the file links. The directory includes the published results CSV and BibTeX, SSRN preprint, code, Bang Niang route and elevation snapshots, replay schema, DDPM GeoJSON and file provenance. Exports continue to use the existing research ledger and snapshots.

Independent review by geometry_forward_review passed after correcting source sampling, chart fragmentation and compact dialog findings. Evidence includes 16 Results geometries, six open data dialogs, enlarged Thai and three Thai landscape pages. Escape returns focus to the data button. Tab and Shift+Tab stay inside the dialog. Run `node scripts/check-playback-data-evidence.mjs` to check the recorded bounds. The check rejects the prior stacked desktop chart size.

Physical-phone touch and GPU frame pacing remain unverified. Browser tests record applied camera positions and clock synchronization rather than a guaranteed frame rate.

## Release verification

Application commit c47b077 is on origin/main. Cloudflare version 344768d7-41d5-47ff-a806-9723a11f0a8a serves the build. HTML, JavaScript, CSS and four linked data files matched local production bytes. The release gate passed 91 TypeScript tests, 11 Python tests, production compilation and all six contrast roles.

In the local walkthrough, opening the source dialog paused the clock at 1.876 seconds. Closing the dialog kept that instant. Seeking to the end aligned camera, clock and water at 3815 seconds. Manual zoom released camera follow and held the clock at 4.073 seconds. The live walkthrough advanced, displayed the endpoint countdown, and synchronized its camera and water sample on Pause. The live 390×844 Results fit one page and downloaded a CSV with five packages, both timing columns, denominator, source, locator and tier. The live browser flow recorded no console errors.

The static scan returned the same nine points on the previous and current commits. Its categories include existing shadow declarations, the three parallel package metrics, border accents, dynamic language attributes and archived evidence images. The independent visual review assessed the actual Results and data dialog at the recorded widths.
