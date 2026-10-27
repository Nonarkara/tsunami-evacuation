import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { type CoastalRegion } from "./research";

export function StudyMap({
  region,
  selected,
  onSelect,
}: {
  region: CoastalRegion;
  selected: number;
  onSelect: (n: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    markers = useRef<L.Marker[]>([]),
    streetLayer = useRef<L.TileLayer | null>(null),
    satLayer = useRef<L.TileLayer | null>(null);

  const callback = useRef(onSelect);
  callback.current = onSelect;

  const [failed, setFailed] = useState(false);
  const [satellite, setSatellite] = useState(false);

  // Initialize map once
  useEffect(() => {
    if (!container.current) return;
    const m = L.map(container.current, {
      center: region.center,
      zoom: region.zoom,
      scrollWheelZoom: false,
      zoomControl: false,
    });
    map.current = m;

    L.control.zoom({ position: "topright" }).addTo(m);
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(m);

    let errors = 0;
    const street = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      },
    ).on("tileerror", () => {
      if (++errors > 4) setFailed(true);
    });

    const sat = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        attribution:
          '&copy; <a href="https://www.esri.com/">Esri Earth Observation</a> · GISTDA/Copernicus Sentinel Relay',
        maxZoom: 18,
      },
    );

    streetLayer.current = street;
    satLayer.current = sat;
    street.addTo(m);

    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(container.current);

    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);

  // Toggle Satellite vs Street
  useEffect(() => {
    if (!map.current || !streetLayer.current || !satLayer.current) return;
    if (satellite) {
      map.current.removeLayer(streetLayer.current);
      satLayer.current.addTo(map.current);
    } else {
      map.current.removeLayer(satLayer.current);
      streetLayer.current.addTo(map.current);
    }
  }, [satellite]);

  // Update markers and bounds whenever region changes
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;

    // Clear old markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    // Add new region markers
    markers.current = region.places.map((p, i) => {
      const marker = L.marker([p.lat, p.lng], {
        keyboard: true,
        title: `${i + 1}. ${p.name} (${p.thaiName})`,
        icon: L.divIcon({
          className: "place-marker",
          html: `<span>${i + 1}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })
        .bindTooltip(
          `<div><strong>${i + 1}. ${p.name}</strong> (${p.thaiName})<br/><small>Elev: ${p.elevationM}m · Safe ridge: ${p.safeDistM}m</small></div>`,
          {
            direction: "top",
            offset: [0, -16],
            className: "map-marker-tooltip",
          },
        )
        .addTo(m)
        .on("click", () => callback.current(i));
      return marker;
    });

    if (region.places.length > 0) {
      m.fitBounds(
        L.latLngBounds(region.places.map((p) => L.latLng(p.lat, p.lng))),
        {
          padding: [36, 36],
          maxZoom: 14,
        },
      );
    }
  }, [region]);

  // Handle selected place changes
  useEffect(() => {
    markers.current.forEach((marker, i) => {
      const isSelected = selected === i;
      marker.getElement()?.classList.toggle("selected", isSelected);
      if (isSelected) {
        marker.openTooltip();
      } else {
        marker.closeTooltip();
      }
    });

    const activePlace = region.places[selected];
    if (activePlace && map.current) {
      if (!map.current.getBounds().contains([activePlace.lat, activePlace.lng])) {
        map.current.panTo([activePlace.lat, activePlace.lng], {
          animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        });
      }
    }
  }, [selected, region]);

  return (
    <div className="map-wrap">
      <div
        ref={container}
        className={`map ${satellite ? "satellite-view" : ""}`}
        role="region"
        aria-label={`Interactive ${region.name} orientation map.`}
      />
      {failed && (
        <div className="map-error" role="status">
          Map tiles unavailable. Use the area buttons below.
        </div>
      )}
      <div className="map-controls-overlay">
        <button
          className={`map-layer-btn ${satellite ? "active" : ""}`}
          onClick={() => setSatellite(!satellite)}
          aria-pressed={satellite}
          title="Toggle Satellite Radar vs Street Map"
        >
          {satellite ? "🛰️ Satellite SAR" : "🗺️ Street Map"}
        </button>
        <button
          className="map-reset-btn"
          onClick={() => {
            if (region.places.length > 0) {
              map.current?.fitBounds(
                L.latLngBounds(
                  region.places.map((p) => L.latLng(p.lat, p.lng)),
                ),
                { padding: [36, 36], maxZoom: 14 },
              );
            }
          }}
          title="Reset map view to region boundaries"
        >
          Reset view
        </button>
      </div>
    </div>
  );
}
