# DDPM Phang Nga links and village snapshot

Reviewed 28 October 2026 (Asia/Bangkok). This page records what was fetched, what the screen shows, and what remains unchecked.

## Evacuation-map links

The Khao Lak view links three public Phang Nga sheets. The files stay on `tsunami.disaster.go.th`. This repository does not store the PDFs or JPEGs.

| Sheet | URLs checked | HTTP | What the PDF text contained |
|---|---|---|---|
| PG_6 | `…/phang-nga/PG_6_600.pdf`, `…/PG_6_1600.pdf`, `…/PG_6.jpg` | 200, `application/pdf` or `image/jpeg` | Ban Bang Niang (บ้านบางเนียง), Nang Thong road, Khao Lak (เขาหลัก) |
| PG_7 | `…/PG_7_600.pdf`, `…/PG_7_1600.pdf`, `…/PG_7.jpg` | 200 | Wat Khammaniyat (คึกคัก), Khao Lak Home Place road |
| PG_10 | `…/PG_10_600.pdf`, `…/PG_10_1600.pdf`, `…/PG_10.jpg` | 200 | Rural road 2030 (ถ.รพช. 2030). Ban Bang Niang and Khao Lak were not in the extracted text |

`PG_7_600.pdf` is 3,570,260 bytes, `Content-Type: application/pdf`, PDF metadata creator Esri ArcGISPro 3.4.3, creation `D:20250509104911`. The PDF `/Title` is empty on PG_6, PG_7 and PG_10, so the place names above are labels read from the page text, not an official sheet title. Checked with `curl` and `pdftotext` on 28 October 2026. The screen credit is:

> แผนที่อพยพหนีภัยสึนามิ — กรมป้องกันและบรรเทาสาธารณภัย (DDPM), tsunami.disaster.go.th

English beside it: “Tsunami evacuation maps — Department of Disaster Prevention and Mitigation (DDPM), tsunami.disaster.go.th.”

## Village snapshot

Source layer: `https://gis-portal.disaster.go.th/arcgis/rest/services/DDPM_RISK_TSUNAMI_Merge/MapServer/57`

Query: `pname='พังงา'`, `outFields=*`, `returnGeometry=true`, `outSR=4326`, `f=geojson`.

| Field | Value |
|---|---|
| File | `public/data/ddpm-phang-nga-risk-villages-2026-10-28.geojson` |
| featureCount | 106, matching `returnCountOnly` |
| tier | `authority-listed` |
| owner | กรมป้องกันและบรรเทาสาธารณภัย (DDPM) |
| reviewedAt | 2026-10-28 |
| retrievedAt | 2026-10-28T20:22:18+07:00 |
| validUntil | 2027-04-28, a repository re-review date, not an official DDPM expiry |
| serviceResponseSha256 | `5623d610d2e71135a1bdde256d1ea185d61a3eb152e7df219837c707e4fdbfe7` |
| geometryBounds | 97.61805558, 7.926099015, 98.64902198, 9.427777812 (EPSG:4326) |

Every point’s geometry matches that feature’s `X_Long` and `Y_Lat` within 10⁻⁶ degrees. `X` and `Y` are large projected numbers and are not used as longitude or latitude. The layer renderer labels `Risk` only as the digits 1, 2, 3 and 4 (43, 21, 30 and 12 features). The map uses one paper ring for every code.

`Height` is present on all 106 features. The values seen in this snapshot span 0.1 to 19.6. The layer metadata does not define the field. The map and the village line omit it. It is not an inundation depth.

`People_M`, `People_F`, `People_All` and `House` are null on 17 features. No census date is on the layer. Those counts are kept in the file and omitted on the map.

Amphoe counts in the snapshot: เมืองพังงา 6, เกาะยาว 20, ตะกั่วทุ่ง 22, ตะกั่วป่า 26, คุระบุรี 13, ทับปุด 4, ท้ายเหมือง 15. All 106 features have `side` = ฝั่งอันดามัน and `pname` = พังงา.

The sibling FeatureServer at `…/FeatureServer/57` answered with capabilities `Query,Create,Update,Delete,Uploads,Editing`. The snapshot was read from MapServer. The running site fetches the committed file only.

Regenerate with `python3 scripts/fetch-ddpm-risk-villages.py`. A new retrieval needs its own review date and file name.

## Screen check, 28 October 2026

Headless Chrome against the production build. Document scroll width and height stayed within the viewport at 320×700, 390×844, 390×600, 667×375, 1024×768 and 1440×900. The DDPM maps control stayed inside the caption row and did not cover the rehearsal controls. Opening the panel showed the Thai and English credit, nine external sheet links, and the village index. Escape returned focus to the trigger. Choosing บ้านบางเนียง put `source Risk 4` in the caption and did not show the source Height value 14.23. Phuket hides the control and the points. The map reached `data-state=ready` with `data-ddpm-villages=106`.

Below 360px the trigger’s visible label is “Maps”; its accessible name remains “DDPM evacuation maps / แผนที่อพยพ ปภ.”

## What this does not establish

No field visit, no official sheet-title confirmation beyond the empty PDF title and the extracted labels, no license text on the layer, no interpretation of `Height` or `Risk`, and no claim that a listed village is inside a mapped inundation extent. Login-gated DDPM layers, warning towers, GISTDA layers and `/tsunami-api` were not requested.
