#!/usr/bin/env python3
"""Save a dated GeoJSON snapshot of DDPM Phang Nga tsunami-risk villages.

Public MapServer query only. Does not call FeatureServer edits, /tsunami-api,
or an ArcGIS token. The sibling FeatureServer advertises Create, Update and
Delete; this file is a static snapshot so the app never reads that service live.

Usage:
  python3 scripts/fetch-ddpm-risk-villages.py [output.geojson]
"""
import hashlib, json, sys, urllib.parse, urllib.request
from datetime import datetime, timedelta, timezone

LAYER = "https://gis-portal.disaster.go.th/arcgis/rest/services/DDPM_RISK_TSUNAMI_Merge/MapServer/57"
FEATURE_SERVER = "https://gis-portal.disaster.go.th/arcgis/rest/services/DDPM_RISK_TSUNAMI_Merge/FeatureServer/57"
WHERE = "pname='พังงา'"
REVIEWED_AT = "2026-10-28"
VALID_UNTIL = "2027-04-28"
DEFAULT_OUT = "public/data/ddpm-phang-nga-risk-villages-2026-10-28.geojson"
UA = "tsunami-evacuation-snapshot/0.1 (static planning pilot; no live query)"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=90) as response:
        return response.read()

def query(params):
    return LAYER + "/query?" + urllib.parse.urlencode(params)

def main():
    out_path = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_OUT
    count_raw = get(query({"where": WHERE, "returnCountOnly": "true", "f": "json"}))
    count = json.loads(count_raw)["count"]
    url = query({
        "where": WHERE,
        "outFields": "*",
        "returnGeometry": "true",
        "outSR": "4326",
        "f": "geojson",
    })
    raw = get(url)
    data = json.loads(raw)
    if data.get("type") != "FeatureCollection" or data.get("crs") not in (None,):
        raise SystemExit("Unexpected GeoJSON header or CRS; refusing to invent a projection")
    features = data.get("features") or []
    if len(features) != count or count < 1:
        raise SystemExit(f"Count mismatch: returnCountOnly={count} features={len(features)}")
    lons, lats = [], []
    for feature in features:
        geometry = feature.get("geometry") or {}
        coords = geometry.get("coordinates")
        props = feature.get("properties") or {}
        if geometry.get("type") != "Point" or not isinstance(coords, list) or len(coords) < 2:
            raise SystemExit("Non-point feature")
        lon, lat = coords[0], coords[1]
        if props.get("pname") != "พังงา":
            raise SystemExit("Feature outside the Phang Nga filter")
        if abs(lon - props["X_Long"]) > 1e-6 or abs(lat - props["Y_Lat"]) > 1e-6:
            raise SystemExit(f"Geometry disagrees with X_Long/Y_Lat for {props.get('Village')}")
        if not (-180 <= lon <= 180 and -90 <= lat <= 90):
            raise SystemExit("Coordinate outside WGS84")
        lons.append(lon)
        lats.append(lat)
    features.sort(key=lambda feature: feature["properties"]["OBJECTID"])
    retrieved = datetime.now(timezone(timedelta(hours=7))).isoformat(timespec="seconds")
    document = {
        "type": "FeatureCollection",
        "schemaVersion": 1,
        "id": "ddpm-phang-nga-risk-villages-2026-10-28",
        "source": "DDPM_RISK_TSUNAMI_Merge MapServer layer 57",
        "sourceUrl": LAYER,
        "query": WHERE,
        "queryUrl": url,
        "tier": "authority-listed",
        "owner": "กรมป้องกันและบรรเทาสาธารณภัย (Department of Disaster Prevention and Mitigation, DDPM)",
        "reviewedAt": REVIEWED_AT,
        "retrievedAt": retrieved,
        "validUntil": VALID_UNTIL,
        "validUntilNote": "Repository re-review date for this snapshot. Not an official DDPM expiry.",
        "featureCount": len(features),
        "crs": "EPSG:4326",
        "serviceResponseSha256": hashlib.sha256(raw).hexdigest(),
        "geometryBounds": [min(lons), min(lats), max(lons), max(lats)],
        "licenseNote": "No license text was published on the MapServer layer metadata retrieved with this snapshot.",
        "heightField": {
            "name": "Height",
            "meaning": "undocumented",
            "display": "omitted",
            "note": "Retained raw from the service. Do not read it as inundation depth, runup, a vertical datum, or a safety clearance.",
        },
        "riskField": {
            "name": "Risk",
            "serviceLabels": ["1", "2", "3", "4"],
            "note": "The layer renderer labels these integers only as the digits 1–4. No legend text was published. Do not translate a code into depth, probability, or a safety class.",
        },
        "countFields": {
            "names": ["People_M", "People_F", "People_All", "House"],
            "note": "Some values are null. No census date is stated on the layer. Not shown on the map and not a current population.",
        },
        "projectedFields": {
            "names": ["X", "Y"],
            "note": "Source numbers in an undocumented projected system. Map position uses the service point in EPSG:4326, which matches X_Long and Y_Lat. X and Y are not longitude or latitude.",
        },
        "featureServerNote": FEATURE_SERVER + " advertised Query,Create,Update,Delete,Uploads,Editing when checked on " + REVIEWED_AT + ". This snapshot was read from MapServer only and the application does not query either service at runtime.",
        "limits": "Authority-listed village points for Phang Nga. Not an inundation extent, evacuation route, refuge, coverage area, or live warning.",
        "features": features,
    }
    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(document, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
    print(f"wrote {out_path} features={len(features)} sha256={document['serviceResponseSha256']} retrievedAt={retrieved}")

if __name__ == "__main__":
    main()
