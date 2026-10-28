import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type CoastalRegion, type Place } from "./research";
import type { BuildingPack } from "./buildings";
import { riskPoint, villageHit, villageSummary, type RiskVillageSnapshot } from "./ddpm";

/**
 * Basic 2D reference map used when 3D rendering is unavailable.
 * It draws only mapped facts: place markers and OpenStreetMap building footprints.
 * It never draws a hazard shape, a run-up level, a route or a refuge indication.
 */
export function StudyMap({
  region,
  selected,
  onSelect,
  buildings,
  villages,
  focus,
}: {
  region: CoastalRegion;
  selected: number;
  onSelect: (n: number) => void;
  buildings?: BuildingPack;
  villages?: RiskVillageSnapshot | null;
  focus?: [number, number] | null;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const buildingLayerRef = useRef<L.LayerGroup | null>(null);
  const villageLayerRef = useRef<L.LayerGroup | null>(null);

  const satLayerRef = useRef<L.TileLayer | null>(null);
  const topoLayerRef = useRef<L.TileLayer | null>(null);

  const callback = useRef(onSelect);
  callback.current = onSelect;

  const [baseLayer, setBaseLayer] = useState<"sat" | "topo">("sat");
  const [isFlownIn, setIsFlownIn] = useState(false);
  const [failed, setFailed] = useState(false);

  const activePlace: Place | undefined = region.places[selected];

  // Initialize Map
  useEffect(() => {
    if (!container.current) return;

    const m = L.map(container.current, {
      center: region.center,
      zoom: region.zoom,
      scrollWheelZoom: false,
      zoomControl: false,
      attributionControl: false,
    });
    map.current = m;

    L.control.zoom({ position: "topright" }).addTo(m);
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(m);

    // High-resolution Esri World Imagery (Satellite / Aerial Aerials)
    let satErrors = 0;
    const sat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          '&copy; <a href="https://www.esri.com/">Esri imagery and contributors</a>',
        maxZoom: 18,
      },
    ).on("tileerror", () => {
      satErrors++;
      if (satErrors > 6) setFailed(true);
    });

    // High-contrast Esri Topographic Map (Elevation & Contours)
    const topo = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          '&copy; <a href="https://www.esri.com/">Esri Topographic</a>',
        maxZoom: 18,
      },
    );

    satLayerRef.current = sat;
    topoLayerRef.current = topo;

    // Default to Satellite Imagery
    sat.addTo(m);

    // Mapped building footprints, drawn as outlines only.
    const buildingGroup = L.layerGroup().addTo(m);
    buildingLayerRef.current = buildingGroup;
    const villageGroup = L.layerGroup().addTo(m);
    villageLayerRef.current = villageGroup;

    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(container.current);
    setTimeout(() => m.invalidateSize(), 80);

    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
      buildingLayerRef.current = null;
      villageLayerRef.current = null;
    };
  }, []);

  // Switch Base Tile Layer (Satellite vs Topo)
  useEffect(() => {
    if (!map.current || !satLayerRef.current || !topoLayerRef.current) return;
    const m = map.current;
    if (baseLayer === "sat") {
      m.removeLayer(topoLayerRef.current);
      satLayerRef.current.addTo(m);
    } else {
      m.removeLayer(satLayerRef.current);
      topoLayerRef.current.addTo(m);
    }
  }, [baseLayer]);

  // Update Region Markers & Fit Bounds
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;

    // Clear old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers for region
    markersRef.current = region.places.map((p, i) => {
      const marker = L.marker([p.lat, p.lng], {
        keyboard: true,
        title: `${i + 1}. ${p.name} (${p.thaiName})`,
        icon: L.divIcon({
          className: `place-marker ${selected === i ? "selected" : ""}`,
          html: `<span>${i + 1}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })
        .bindTooltip(
          `<div class="marker-tip">
            <strong>${i + 1}. ${p.name}</strong> <small>(${p.thaiName})</small><br/>
            <span>Geographic place marker · refuge verification pending</span>
          </div>`,
          {
            direction: "top",
            offset: [0, -16],
            className: "map-marker-tooltip",
          },
        )
        .addTo(m)
        .on("click", () => {
          callback.current(i);
        });
      return marker;
    });

    if (region.places.length > 0 && !isFlownIn) {
      m.fitBounds(
        L.latLngBounds(region.places.map((p) => L.latLng(p.lat, p.lng))),
        { padding: [40, 40], maxZoom: 13 },
      );
    }
  }, [region]);

  // Draw the OpenStreetMap building snapshot for the selected place.
  useEffect(() => {
    const group = buildingLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!buildings || buildings.features.length === 0) return;
    L.geoJSON(buildings as unknown as GeoJSON.FeatureCollection, {
      interactive: false,
      style: {
        color: "#12354e",
        weight: 0.6,
        opacity: 0.45,
        fill: true,
        fillColor: "#dbe4e8",
        fillOpacity: 0.14,
      },
    }).addTo(group);
  }, [buildings]);

  useEffect(() => {
    const group = villageLayerRef.current;
    if (!group) return;
    group.clearLayers();
    if (!villages) return;
    for (const feature of villages.features) {
      const hit = villageHit(feature.properties);
      const [lon, lat] = feature.geometry.coordinates;
      if (!hit) continue;
      L.circleMarker([lat, lon], {
        radius: 4,
        color: riskPoint.stroke,
        weight: riskPoint.strokeWidth,
        fillColor: riskPoint.fill,
        fillOpacity: 1,
      }).bindTooltip(villageSummary(hit), { direction: "top", className: "map-marker-tooltip" }).addTo(group);
    }
  }, [villages]);

  useEffect(() => {
    if (!map.current || !focus) return;
    map.current.flyTo([focus[1], focus[0]], 14, { duration: 1 });
  }, [focus]);

  // Fly-In Camera Action to Active Place
  const flyToPlace = useCallback((p: Place, zoomLevel = 15) => {
    if (!map.current) return;
    setIsFlownIn(true);
    map.current.flyTo([p.lat, p.lng], zoomLevel, {
      duration: 1.4,
      easeLinearity: 0.25,
    });
  }, []);

  const resetRegionalOverview = useCallback(() => {
    if (!map.current || region.places.length === 0) return;
    setIsFlownIn(false);
    map.current.fitBounds(
      L.latLngBounds(region.places.map((p) => L.latLng(p.lat, p.lng))),
      { padding: [40, 40], maxZoom: 13 },
    );
  }, [region]);

  // Synchronize Active Marker Selection
  useEffect(() => {
    markersRef.current.forEach((marker, i) => {
      const isSelected = selected === i;
      const el = marker.getElement();
      if (el) el.classList.toggle("selected", isSelected);
    });

    if (activePlace && isFlownIn) {
      flyToPlace(activePlace, 15);
    }
  }, [selected, activePlace, isFlownIn, flyToPlace]);

  return (
    <div className="map-wrap map-reference">
      {/* Interactive Leaflet Map Viewport */}
      <div
        ref={container}
        className={`map ${baseLayer === "sat" ? "satellite-view" : "topo-view"}`}
        role="region"
        aria-label={`Interactive map of ${region.name}`}
      />

      {failed && (
        <div className="map-fallback-banner" role="alert">
          Satellite tiles unavailable. Try the topographic layer or retry later. No offline basemap is installed.
        </div>
      )}

      {/* ── § Layer & Camera Controls ── */}
      <div className="map-controls-overlay">
        <div className="control-button-group">
          <button
            className={`map-ctrl-btn ${baseLayer === "sat" ? "active" : ""}`}
            onClick={() => setBaseLayer(baseLayer === "sat" ? "topo" : "sat")}
            title="Toggle between Esri Satellite Aerial Imagery and Topographic Contours"
          >
            {baseLayer === "sat" ? "Aerial" : "Topo"}
          </button>
        </div>

        <div className="control-button-group">
          {activePlace && (
            <button
              className={`map-ctrl-btn fly-btn ${isFlownIn ? "flown" : ""}`}
              onClick={() => {
                if (isFlownIn) {
                  resetRegionalOverview();
                } else {
                  flyToPlace(activePlace, 15);
                }
              }}
              title="Move the map to the selected place"
            >
              {isFlownIn ? "Region" : "Focus"}
            </button>
          )}

          <button
            className="map-ctrl-btn"
            onClick={resetRegionalOverview}
            title="Reset map view to entire coastal subduction reach"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
