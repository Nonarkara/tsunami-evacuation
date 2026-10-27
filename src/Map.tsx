import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type CoastalRegion, type Place } from "./research";

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

  // Render Evacuation Routes (Safe Walking vs Highway Gridlock)
  useEffect(() => {
    if (!routeLayersRef.current || !activePlace) return;
    const group = routeLayersRef.current;
    group.clearLayers();

    if (!showRoutes) return;

    const beach = activePlace.beachCoord || [
      activePlace.lat,
      activePlace.lng - 0.007,
    ];
    const safeRidge = activePlace.safeRidgeCoord || [
      activePlace.lat,
      activePlace.lng + 0.012,
    ];
    const refuge = activePlace.verticalRefuge;

    // 1. Safe Pedestrian Evacuation Path (Glowing Emerald)
    const walkPoints: [number, number][] = [
      beach,
      [activePlace.lat, activePlace.lng],
      safeRidge,
    ];

    const walkPolyline = L.polyline(walkPoints, {
      color: "#10b981",
      weight: 5,
      opacity: 0.95,
      dashArray: "8, 6",
      className: "safe-walk-path",
    }).bindTooltip(
      `🚶 <strong>Safe Pedestrian Walking Route</strong><br/>
       ${activePlace.safeDistM}m on foot · ~${activePlace.walkMinutes || 10} min to high ground (&gt;15m)`,
      { sticky: true, className: "route-tooltip safe-tip" },
    );
    group.addLayer(walkPolyline);

    // 2. Lethal Vehicular Gridlock Route (Crimson Warning Line)
    // Runs roughly north-south parallel to coast (Highway 4 / main strip)
    const gridlockPoints: [number, number][] = [
      [activePlace.lat - 0.012, activePlace.lng],
      [activePlace.lat, activePlace.lng],
      [activePlace.lat + 0.012, activePlace.lng],
    ];

    const gridlockPolyline = L.polyline(gridlockPoints, {
      color: "#ef4444",
      weight: 4,
      opacity: 0.85,
      dashArray: "5, 8",
      className: "gridlock-path",
    }).bindTooltip(
      `⛔ <strong>Lethal Vehicular Gridlock Route</strong><br/>
       ${activePlace.gridlockWarning || "Highway chokes within 8 minutes of alert. Do not drive."}`,
      { sticky: true, className: "route-tooltip danger-tip" },
    );
    group.addLayer(gridlockPolyline);

    // 3. Certified Vertical Refuge Marker
    if (refuge) {
      const refugeMarker = L.circleMarker(
        [activePlace.lat + 0.003, activePlace.lng + 0.004],
        {
          radius: 9,
          fillColor: "#f59e0b",
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
          className: "refuge-marker-pulse",
        },
      ).bindTooltip(
        `🏢 <strong>Vertical Refuge: ${refuge.name}</strong><br/>
         ${refuge.floors} Floors (${refuge.type}) · Cap: ${refuge.capacity} people · ${refuge.distM}m away`,
        { sticky: true, className: "route-tooltip refuge-tip" },
      );
      group.addLayer(refugeMarker);
    }

    // 4. Safe Ridge (>15m High Ground) Marker
    const safeRidgeMarker = L.circleMarker(safeRidge, {
      radius: 9,
      fillColor: "#10b981",
      color: "#ffffff",
      weight: 2,
      fillOpacity: 1,
      className: "safe-ridge-marker",
    }).bindTooltip(
      `🛡️ <strong>Safe Ridge High Ground</strong><br/>Elevation &gt;15m MSL (Safe from 2004 Max Runup)`,
      { sticky: true, className: "route-tooltip safe-tip" },
    );
    group.addLayer(safeRidgeMarker);
  }, [activePlace, showRoutes]);

  // Water Reach Level Animation & Inundation Simulation
  useEffect(() => {
    if (!surgeLayersRef.current || !activePlace) return;
    const group = surgeLayersRef.current;
    group.clearLayers();

    if (waterLevelM <= 0) return;

    // Calculate dynamic surge penetration distance inland
    // At 15m runup, water reaches the full safe distance of the coast
    const penetrationFactor = Math.min(waterLevelM / 15, 1);
    const centerLng = activePlace.lng;
    const centerLat = activePlace.lat;

    // Create an advancing coastal water polygon representing the tsunami surge
    // Coastline is to the west in Andaman Sea; surge sweeps inland to the east
    const surgeExtentLng = centerLng - 0.015 + penetrationFactor * 0.02;

    const surgePolygonCoords: [number, number][] = [
      [centerLat - 0.03, centerLng - 0.04],
      [centerLat + 0.03, centerLng - 0.04],
      [centerLat + 0.03, surgeExtentLng],
      [centerLat + 0.015, surgeExtentLng + 0.002],
      [centerLat, surgeExtentLng],
      [centerLat - 0.015, surgeExtentLng + 0.003],
      [centerLat - 0.03, surgeExtentLng],
    ];

    // Translucent Oceanic Surge Polygon
    const surgePoly = L.polygon(surgePolygonCoords, {
      fillColor: "#0284c7",
      fillOpacity: 0.55 + penetrationFactor * 0.25,
      color: "#38bdf8",
      weight: 3,
      className: "surge-wave-poly",
    }).bindTooltip(
      `🌊 <strong>Simulated Tsunami Wave Reach: +${waterLevelM.toFixed(1)}m</strong><br/>
       Inland penetration: ~${Math.round(penetrationFactor * activePlace.safeDistM)}m`,
      { sticky: true, className: "route-tooltip surge-tip" },
    );
    group.addLayer(surgePoly);

    // Advancing Wave Foam Crest (Leading Edge)
    const crestLineCoords: [number, number][] = [
      [centerLat - 0.03, surgeExtentLng],
      [centerLat - 0.015, surgeExtentLng + 0.003],
      [centerLat, surgeExtentLng],
      [centerLat + 0.015, surgeExtentLng + 0.002],
      [centerLat + 0.03, surgeExtentLng],
    ];

    const crestPolyline = L.polyline(crestLineCoords, {
      color: "#e0f2fe",
      weight: 5,
      opacity: 0.95,
      className: "wave-crest-line",
    });
    group.addLayer(crestPolyline);
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

  // Calculate Submersion Status for Selected Place
  const isSubmerged = activePlace && waterLevelM > activePlace.elevationM;
  const submergenceDepth =
    activePlace && isSubmerged
      ? (waterLevelM - activePlace.elevationM).toFixed(1)
      : "0.0";
  const dryMargin =
    activePlace && !isSubmerged
      ? (activePlace.elevationM - waterLevelM).toFixed(1)
      : "0.0";

  return (
    <div className={`map-wrap ${is3D ? "mode-3d" : ""}`}>
      {/* Interactive Leaflet Map Viewport */}
      <div
        ref={container}
        className={`map ${baseLayer === "sat" ? "satellite-view" : "topo-view"}`}
        role="region"
        aria-label={`Interactive 3D aerial map and evacuation routes for ${region.name}.`}
      />

      {failed && (
        <div className="map-error" role="status">
          Satellite feed reconnecting. Use the area coordinates below.
        </div>
      )}

      {/* Floating Control HUD: 3D Aerial, Fly-In, Routes & Layers */}
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
            title="Toggle Evacuation Walking Routes vs Vehicle Gridlock Overlays"
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

      {/* ── § Water Reach Level Animation & Inundation Simulator ── */}
      <div className="water-reach-simulator-bar">
        <div className="simulator-header">
          <div className="sim-title">
            <span className="sim-pulse-dot" />
            <strong>Water Reach Level Simulator</strong>
            <small>Interactive Tsunami Inundation Sweep (0m – 15m)</small>
          </div>

          <div className="sim-status-badge">
            {waterLevelM === 0 ? (
              <span className="badge-normal">Normal Sea Level (0.0m)</span>
            ) : isSubmerged ? (
              <span className="badge-submerged">
                ⚠️ {activePlace?.name} Submerged ({submergenceDepth}m Depth)
              </span>
            ) : (
              <span className="badge-safe">
                ✅ Dry Ground Margin (+{dryMargin}m)
              </span>
            )}
          </div>
        </div>

        <div className="simulator-controls">
          <button
            className={`sim-play-btn ${isPlaying ? "playing" : ""}`}
            onClick={handlePlayToggle}
            aria-label={
              isPlaying ? "Pause Water Simulation" : "Simulate Tsunami Wave Reach"
            }
          >
            {isPlaying ? "⏸ Pause" : "▶ Animate Wave Reach"}
          </button>

          <div className="sim-slider-wrap">
            <label htmlFor="water-level-slider" className="sr-only">
              Simulated Tsunami Water Level in Meters
            </label>
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
              className="water-level-slider"
            />
            <div className="slider-ticks" aria-hidden="true">
              <span onClick={() => setWaterLevelM(0)}>0m Normal</span>
              <span onClick={() => setWaterLevelM(3)}>3m Beach Wash</span>
              <span onClick={() => setWaterLevelM(6)}>6m Resorts</span>
              <span onClick={() => setWaterLevelM(10)}>10m Hwy 4</span>
              <span onClick={() => setWaterLevelM(15)}>15m Max Run-up</span>
            </div>
          </div>

          <div className="sim-level-display">
            <span className="level-number">+{waterLevelM.toFixed(1)}m</span>
            <span className="level-label">Surge Height</span>
          </div>
        </div>
      </div>
    </div>
  );
}