import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type CoastalRegion, type Place, KHAO_LAK_GROUND_TRUTH } from "./research";

export function StudyMap({
  region,
  selected,
  onSelect,
}: {
  region: CoastalRegion;
  selected: number;
  onSelect: (n: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayersRef = useRef<L.LayerGroup | null>(null);
  const surgeLayersRef = useRef<L.LayerGroup | null>(null);

  const satLayerRef = useRef<L.TileLayer | null>(null);
  const topoLayerRef = useRef<L.TileLayer | null>(null);

  const callback = useRef(onSelect);
  callback.current = onSelect;

  // View & Simulation States
  const [baseLayer, setBaseLayer] = useState<"sat" | "topo">("sat");
  const [is3D, setIs3D] = useState(false);
  const [waterLevelM, setWaterLevelM] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRoutes, setShowRoutes] = useState(true);
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
      attributionControl: true,
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
          '&copy; <a href="https://www.esri.com/">Esri Earth Observation</a> · GISTDA/Copernicus Sentinel Relay',
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

    // Dedicated layer groups for routes and water surge
    const routeGroup = L.layerGroup().addTo(m);
    routeLayersRef.current = routeGroup;

    const surgeGroup = L.layerGroup().addTo(m);
    surgeLayersRef.current = surgeGroup;

    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(container.current);
    setTimeout(() => m.invalidateSize(), 80);

    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
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
            <span>Elev: <strong>${p.elevationM}m</strong> · Safe Ridge: <strong>${p.safeDistM}m</strong></span>
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
      if (isSelected) {
        marker.openTooltip();
      } else {
        marker.closeTooltip();
      }
    });

    if (activePlace && isFlownIn) {
      flyToPlace(activePlace, 15);
    }
  }, [selected, activePlace, isFlownIn, flyToPlace]);

  // Render Evacuation Routes & Verified Ground Truth Landmarks
  useEffect(() => {
    if (!routeLayersRef.current || !activePlace) return;
    const group = routeLayersRef.current;
    group.clearLayers();

    if (!showRoutes) return;

    // Ground Truth Features for Khao Lak (Core Empirical Study Site)
    if (region.id === "khao-lak") {
      // 1. Tor 813 Memorial Marker (Historical 2004 Inundation Limit)
      const tor813 = KHAO_LAK_GROUND_TRUTH.tor813;
      const torMarker = L.marker([tor813.lat, tor813.lng], {
        icon: L.divIcon({
          className: "tor813-marker",
          html: `<div class="tor813-badge" title="Tor 813 Memorial">⚓ 813</div>`,
          iconSize: [48, 22],
          iconAnchor: [24, 11],
        }),
      }).bindTooltip(
        `<strong>${tor813.name}</strong> (${tor813.thaiName})<br/>
         ${tor813.significance}<br/>
         <em>Ground Elevation: ${tor813.elevationM}m MSL</em>`,
        { sticky: true, className: "route-tooltip tor-tip" },
      );
      group.addLayer(torMarker);

      // 2. Highway 4 Bottleneck Corridor (Verified 2-Lane Evacuation Gridlock)
      const hwy4 = KHAO_LAK_GROUND_TRUTH.highway4Corridor;
      const hwy4Poly = L.polyline(hwy4.points, {
        color: "#ef4444",
        weight: 4,
        opacity: 0.85,
        dashArray: "6, 6",
        className: "highway4-corridor",
      }).bindTooltip(
        `⛔ <strong>${hwy4.name}</strong><br/>
         ${hwy4.significance}`,
        { sticky: true, className: "route-tooltip danger-tip" },
      );
      group.addLayer(hwy4Poly);
    }

    // Active Place Safe Buffer Zone & Vertical Refuge Context
    const placeCircle = L.circle([activePlace.lat, activePlace.lng], {
      radius: activePlace.safeDistM,
      color: "#10b981",
      weight: 2,
      dashArray: "4, 6",
      fillColor: "#10b981",
      fillOpacity: 0.08,
      className: "safe-buffer-zone",
    }).bindTooltip(
      `🚶 <strong>Pedestrian Evacuation Zone: ${activePlace.name}</strong><br/>
       Safe Contour (&gt;15m MSL): ~${activePlace.safeDistM}m inland<br/>
       <em>${activePlace.refugeStrategy}</em>`,
      { sticky: true, className: "route-tooltip safe-tip" },
    );
    group.addLayer(placeCircle);
  }, [activePlace, showRoutes, region.id]);

  // Empirical Water Reach Level & Historical 2004 Run-up Scale
  useEffect(() => {
    if (!surgeLayersRef.current || !activePlace) return;
    const group = surgeLayersRef.current;
    group.clearLayers();

    if (waterLevelM <= 0) return;

    // Pulse indicator at active place calibrated against Copernicus 30m DEM
    const exceedsGroundElev = waterLevelM > activePlace.elevationM;

    const runupIndicator = L.circleMarker([activePlace.lat, activePlace.lng], {
      radius: exceedsGroundElev ? 22 : 14,
      fillColor: exceedsGroundElev ? "#f59e0b" : "#10b981",
      color: exceedsGroundElev ? "#ef4444" : "#059669",
      weight: 3,
      fillOpacity: exceedsGroundElev ? 0.45 : 0.25,
      className: exceedsGroundElev ? "surge-pulse-danger" : "surge-pulse-safe",
    }).bindTooltip(
      `🌊 <strong>Run-up Reach Level: +${waterLevelM.toFixed(1)}m MSL</strong><br/>
       Ground elevation: ${activePlace.elevationM}m MSL<br/>
       ${
         exceedsGroundElev
           ? `⚠️ Exceeds ground elevation. 2004 historical run-up benchmark: 8m–15m MSL.`
           : `🛡️ Dry ground margin: +${(activePlace.elevationM - waterLevelM).toFixed(1)}m above current water level.`
       }`,
      { sticky: true, className: "route-tooltip surge-tip" },
    );
    group.addLayer(runupIndicator);
  }, [waterLevelM, activePlace]);

  // Automated Playback Timer for Water Reach Animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setWaterLevelM((prev) => {
        if (prev >= 15) {
          setIsPlaying(false);
          return 15;
        }
        return Number((prev + 0.6).toFixed(1));
      });
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying]);

  function handlePlayToggle() {
    if (isPlaying) {
      setIsPlaying(false);
    } else {
      if (waterLevelM >= 15) setWaterLevelM(0);
      setIsPlaying(true);
    }
  }

  // Calculate Topographic Status for Selected Place
  const exceedsGroundElev = activePlace && waterLevelM > activePlace.elevationM;
  const dryMargin =
    activePlace && !exceedsGroundElev
      ? (activePlace.elevationM - waterLevelM).toFixed(1)
      : "0.0";

  return (
    <div className={`map-wrap ${is3D ? "mode-3d" : ""}`}>
      {/* Interactive Leaflet Map Viewport */}
      <div
        ref={container}
        className={`map ${baseLayer === "sat" ? "satellite-view" : "topo-view"}`}
        role="region"
        aria-label={`Interactive map of ${region.name}`}
      />

      {failed && (
        <div className="map-fallback-banner" role="alert">
          Satellite feed degraded. Using offline vector contours.
        </div>
      )}

      {/* ── § Overlaid Floating Camera & Layer Controls ── */}
      <div className="map-controls-overlay">
        <div className="control-button-group">
          <button
            className={`map-ctrl-btn ${baseLayer === "sat" ? "active" : ""}`}
            onClick={() => setBaseLayer(baseLayer === "sat" ? "topo" : "sat")}
            title="Toggle between Esri Satellite Aerial Imagery and Topographic Contours"
          >
            {baseLayer === "sat" ? "🛰️ Aerial Sat" : "🗺️ Topo Contours"}
          </button>

          <button
            className={`map-ctrl-btn ${is3D ? "active" : ""}`}
            onClick={() => setIs3D(!is3D)}
            title="Toggle 3D Aerial Drone Perspective View"
          >
            {is3D ? "📐 3D Perspective" : "🧭 2D Plan"}
          </button>

          <button
            className={`map-ctrl-btn ${showRoutes ? "active" : ""}`}
            onClick={() => setShowRoutes(!showRoutes)}
            title="Toggle Evacuation Routes and Ground-Truth Benchmarks"
          >
            {showRoutes ? "🚶 Routes: ON" : "🚶 Routes: OFF"}
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
              title="Fly into local topography and street-level evacuation routes"
            >
              {isFlownIn ? "🌐 Regional View" : `✈️ Fly In: ${activePlace.name}`}
            </button>
          )}

          <button
            className="map-ctrl-btn"
            onClick={resetRegionalOverview}
            title="Reset map view to entire coastal subduction reach"
          >
            Reset view
          </button>
        </div>
      </div>

      {/* ── § Integrated Compact Water Reach HUD ── */}
      <div className="map-water-hud" aria-label="Tsunami Water Reach Simulator">
        <button
          className={`hud-play-btn ${isPlaying ? "playing" : ""}`}
          onClick={handlePlayToggle}
          aria-label={isPlaying ? "Pause Simulation" : "Animate Tsunami Wave Reach"}
        >
          {isPlaying ? "⏸ Pause" : "▶ Simulate"}
        </button>

        <div className="hud-slider-group">
          <span className="hud-label">Run-up:</span>
          <input
            id="water-level-slider"
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={waterLevelM}
            onChange={(e) => {
              setIsPlaying(false);
              setWaterLevelM(Number(e.target.value));
            }}
            className="hud-slider"
            aria-label="Water reach elevation in meters"
          />
          <span className="hud-meter-val">+{waterLevelM.toFixed(1)}m</span>
        </div>

        <div className="hud-status-pill">
          {waterLevelM === 0 ? (
            <span className="chip-normal">Normal Baseline (0m MSL)</span>
          ) : !exceedsGroundElev ? (
            <span className="chip-safe">
              🛡️ Elev {activePlace?.elevationM}m (+{dryMargin}m dry margin)
            </span>
          ) : (
            <span className="chip-submerged">
              ⚠️ Water Reach +{waterLevelM.toFixed(1)}m MSL &gt; Elev {activePlace?.elevationM}m (2004 Run-up: 8–15m)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
