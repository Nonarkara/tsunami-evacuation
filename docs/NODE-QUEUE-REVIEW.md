# Network queues without invented crowd geometry

27 October2026. The user rejected the full desktop composition and the sunflower-like crowd ring. That ring was not an output of pedestrian interaction, density or collision modeling: the renderer added angular/radial offsets to spread waiting people around a point queue. Disclosing that offset did not make its implied physical footprint valid.

## Correction

The FIFO exercise still computes the same release, walking, queue, arrival and waiting-time results. Moving people render at the exact interpolated position on their modeled road segment. Waiting/release groups render as weighted totals at exact model nodes. No offset, ring, spiral, lane or queue-tail arrangement is invented. A node symbol is a count location, not a physical crowd footprint. Click a group or use Queue to read its current count in the adjacent caption. Changing mode, inputs, camera or resetting clears that selection when appropriate.

The former one-feature-per-person waiting representation is replaced by one feature per status/node with a count. Thus the sum of feature weights plus arrivals equals population, even though the number of drawn features is smaller. This preserves the interactive map and all modeled people; it changes the representation of waiting groups, not model outcomes.

## Desktop composition

At1280px and above, the operating controls and counts sit beside the selected route’s elevation profile. The source disclosure follows this shared work area. At smaller widths the controls wrap; the timeline has a530px maximum width and is grouped with parameter inputs. Phone layouts retain intrinsic label/value rows and all model qualifications. The map, routes, controls, source credits, planner, drill and published research remain.

## Verification

The same5000-person,1m-pinch,1.4m/s case at4416seconds still has729 walking,2799 queued and1472 arrived. New executable tests prove weighted conservation, one group per status/node, exact node coordinates and exact moving-segment interpolation. Restoring decorative offsets fails those tests. The original model/source/plan/drill tests remain.

`design/node-contract.json` retains the prior14 cases and adds a bounded timeline and presentation identity. Browser captures and independent review are appended after completion. This is still an uncalibrated network-flow exercise; no collision, spillback, mobility mix, wave interaction or physical crowd density has been validated.

Independent review `/root/queue_geometry_review` passed source/tests and the queue case plus390/1024/1280/1440 screenshots. Counts, group weights and exact coordinates are consistent; no invented footprint remains. State-reset/documentation findings were applied. Minor wording was updated from amber ring to amber point.

All14 declared layout cases pass with the new presentation identity. At1280×720 the operation and profile columns are596px each; the timeline is530px wide and40px high. The selected5000-person queue case also fits a360×800 panel: document width360px, counts bottom776.88px. One initial390px capture occurred during an overview camera flight; the stable overview was recaptured and passed without changing budgets.

The executable isolated regression compares the old frame function to the corrected one:2799 old waiting features had off-node invented coordinates; the new frame has one queue symbol at the exact node, weighted2799, and zero off-node queue coordinates. See `design/node-regression.json`.

## Live release

Application commit `cf61db7eb7593965b6d72c2c56e3d0484bab771e`; Cloudflare Worker version `32025a2a-9053-4361-a503-801301d22cd0`. Tests14/14, strict build and contrast passed before publishing. GitHub CI: https://github.com/Nonarkara/tsunami-evacuation/actions/runs/40533253233 . Canonical HTML plus `index-C4qcbcqd.js` and `index-DQeM1d_S.css` returned200 and exactly matched local production bytes.

The live page loaded `network-node-totals`, reproduced the same729/2799/1472 result, displayed the selected node count outside the terrain and rendered the regrouped596px operation/profile columns with530px timeline. The selected-queue geometry case passes; coastal-place marker visibility is excluded only for this inland close-up, while all default overview cases retain that check. `design/node-live.json` and `docs/evidence/node-live-1280.png` preserve the live result.
