import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { places } from "./research";
export function StudyMap({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (n: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<L.Map | null>(null),
    markers = useRef<L.Marker[]>([]);
  const callback = useRef(onSelect);
  callback.current = onSelect;
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!container.current) return;
    const m = L.map(container.current, {
      center: [8.682, 98.264],
      zoom: 12,
      scrollWheelZoom: false,
      zoomControl: false,
    });
    map.current = m;
    L.control.zoom({ position: "topright" }).addTo(m);
    L.control.scale({ position: "bottomleft", imperial: false }).addTo(m);
    m.fitBounds(L.latLngBounds(places.map((p) => L.latLng(p.lat, p.lng))), {
      padding: [32, 32],
      maxZoom: 13,
    });
    let errors = 0;
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    })
      .on("tileerror", () => {
        if (++errors > 3) setFailed(true);
      })
      .addTo(m);
    markers.current = places.map((p, i) =>
      L.marker([p.lat, p.lng], {
        keyboard: true,
        title: p.name,
        icon: L.divIcon({
          className: "place-marker",
          html: `<span>${i + 1}</span>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        }),
      })
        .addTo(m)
        .on("click", () => callback.current(i)),
    );
    const observer = new ResizeObserver(() => m.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    markers.current.forEach((marker, i) =>
      marker.getElement()?.classList.toggle("selected", selected === i),
    );
    if (
      map.current &&
      !map.current
        .getBounds()
        .contains([places[selected].lat, places[selected].lng])
    )
      map.current.panTo([places[selected].lat, places[selected].lng], {
        animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      });
  }, [selected]);
  return (
    <div className="map-wrap">
      <div
        ref={container}
        className="map"
        role="region"
        aria-label="Interactive Khao Lak orientation map. Use the area buttons below as a keyboard alternative."
      />
      {failed && (
        <div className="map-error" role="status">
          Map tiles unavailable. Use the area selector below; no evacuation
          directions depend on this map.
        </div>
      )}
      <button
        className="map-reset"
        onClick={() =>
          map.current?.fitBounds(
            L.latLngBounds(places.map((p) => L.latLng(p.lat, p.lng))),
            { padding: [32, 32], maxZoom: 13 },
          )
        }
      >
        Reset view
      </button>
    </div>
  );
}
