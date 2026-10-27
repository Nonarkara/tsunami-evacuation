import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type CoastalRegion, type Place } from "./research";

export function StudyMap({
  region,
  selected,
  onSelect,
  referenceOnly = false,
}: {
  region: CoastalRegion;
  selected: number;
  onSelect: (n: number) => void;
  referenceOnly?: boolean;
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
  const [isTilted, setIsTilted] = useState(false);
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

    // No unverified road lines, refuge buffers or inundation boundaries are drawn.
    // OSM exercise paths and terrain now live in TerrainRehearsal.
  }, [activePlace, showRoutes, region.id]);

  // Empirical Water Reach Level & Historical 2004 Run-up Scale
  useEffect(() => {
    if (!surgeLayersRef.current || !activePlace) return;
    const group = surgeLayersRef.current;
    group.clearLayers();

    if (waterLevelM <= 0) return;

    // Reference scale only: an elevation comparison cannot establish inundation.
    // Deliberately draw no safe/dry marker from an unverified point height.
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
  const exceedsGroundElev = false;
  const dryMargin =
    activePlace && !exceedsGroundElev
      ? "unverified"
      : "0.0";

  return (
    <div className={`map-wrap ${isTilted ? "mode-tilted" : ""}`}>
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

          {!referenceOnly && <button
            className={`map-ctrl-btn ${isTilted ? "active" : ""}`}
            onClick={() => setIsTilted(!isTilted)}
            title="Tilt the flat reference map; this does not render terrain"
          >
            {isTilted ? "📐 Tilted reference" : "🧭 2D Plan"}
          </button>}

          {!referenceOnly && <button
            className={`map-ctrl-btn ${showRoutes ? "active" : ""}`}
            onClick={() => setShowRoutes(!showRoutes)}
            title="Toggle Evacuation Routes and Ground-Truth Benchmarks"
          >
            {showRoutes ? "Place references: ON" : "Place references: OFF"}
          </button>}
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
      {!referenceOnly && <div className="map-water-hud" aria-label="Illustrative water-level reference">
        <button
          className={`hud-play-btn ${isPlaying ? "playing" : ""}`}
          onClick={handlePlayToggle}
          aria-label={isPlaying ? "Pause Simulation" : "Animate reference water level"}
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
            <span className="chip-normal">Reference level only</span>
          ) : !exceedsGroundElev ? (
            <span className="chip-safe">
              Terrain validation: {dryMargin} · no safety inference
            </span>
          ) : (
            <span className="chip-submerged">
              ⚠️ Water Reach +{waterLevelM.toFixed(1)}m MSL &gt; Elev {activePlace?.elevationM}m (2004 Run-up: 8–15m)
            </span>
          )}
        </div>
      </div>}
    </div>
  );
}
