# On-demand Thai / English manual

28 October 2026. The question-mark button opens a bilingual native dialog from every section. It adds no persistent content band, automatic tour or chatbot. A compact three-step quick start links to geography, personal plan and research. Five expandable topics explain the actual map/replay controls, plan saving, drill logger, research exports and disconnected sensor catalogue. The current section appears first. Topic headings pair the existing navigation symbols with their names so readers can learn them.

The first draft opened long Model instructions immediately. The final default keeps those instructions behind an explicit disclosure: quick start, all five topic doors, language controls and close are visible on the initial surface. Reading earns scrolling only when expanded. Opened topics may be retained while the manual remains mounted. The guide keeps prior typed entries and does not automatically pause playback; this behavior and the Pause instruction are stated. It does not upload data or save personal plans.

Scientific boundaries remain explicit in both languages: Bang Niang is the only connected walking exercise; routes/endpoints are unapproved; point-queue totals do not describe a physical crowd footprint; default water rise is illustrative; imported research frames are an unverified replay; neither water mode controls agent movement. Satellite is a catalogue, not connected warning telemetry. Existing English UI control names are retained in Thai explanations to match what users see. Native human/community language review remains unverified.

## Interaction and keyboard

Native showModal supplies dialog semantics and makes the underlying application inert. Close and Escape return focus to the triggering Manual button. Quick-start and section buttons close the guide, navigate and focus main content. Unsaved Plan input preservation was tested with a synthetic unsaved value, then restored; no save was performed. An explicit language parameter takes precedence over browser preference. Manual language choice persists in component state; a changed language query is adopted on the next opening.

An actual Tab trial found native behavior alone crossed to BODY after the final control. The corrected boundary handler considers visible controls, including summary elements and buttons in expanded topics, and wraps forward/reverse focus without intercepting Escape. Stored before traces contain that failure (`design/manual-keyboard-before.json`). All96post-fix steps passed:24forward and24reverse with topics collapsed, then the same with all five expanded. Escape/opener and section/main focus also passed. The close control remains visible at scrollTop1722in the expanded phone trial.

## Geometry and independent review

Actual browser measurements are in `design/manual-metrics.json`, `manual-header-metrics.json` and `manual-result.json`. Thai/English default views at320×800,390×844,1024×768 and1440×900 pass content-specific budgets: heading≤100px, quick-start≤230px, close and all five topics visible, no horizontal overflow. The manual sizes to content: about556px English /584px Thai tall at390px, rather than an empty fixed-height sheet. In expanded states a single native modal scroll surface holds the full instructions.

The six-control header (five destinations + manual) remains one row,46px phone /38px desktop, at320/360/390/681/800/1024/1440. All controls remain inside the bar with minimum24px width and36px height. The existing archived86px header still violates the unchanged48px limit. Three unchanged map/task cases at390/1024/1440pass after closing the manual (`manual-map-regression.json`).

Independent reviewer `bilingual_research_review` inspected source fidelity, native-dialog lifecycle, final compact screenshots, expanded/readiness metrics and the explicit keyboard fix. All findings were closed. Source review confirmed actual drill fields and distinguishing imported research replay from default illustrations.27unit tests passed, including language precedence/fallback, and strict TypeScript compilation passed. The release command reruns tests/build/contrast before deployment. Screenshots are in `docs/evidence/manual-*.png`.

Canonical commit, Worker and live verification follow after successful deployment.
