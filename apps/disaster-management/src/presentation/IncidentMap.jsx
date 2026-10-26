import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
export default function IncidentMap({ incidents, selectedId, onSelect }) {
  const container = useRef(null);
  const map = useRef(null);
  const layer = useRef(null);
  useEffect(() => {
    const instance = L.map(container.current).setView([16.755, 100.207], 13);
    map.current = instance;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(instance);
    layer.current = L.layerGroup().addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      instance.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    if (!map.current) return;
    layer.current.clearLayers();
    incidents.forEach((item) => {
      const marker = L.circleMarker([item.lat, item.lng], {
        radius: item.id === selectedId ? 13 : 9,
        color: item.severity === "HIGH" ? "#b43e2e" : "#116536",
        weight: 3,
        fillColor: item.id === selectedId ? "#fff" : "#116536",
        fillOpacity: 0.85,
      }).addTo(layer.current);
      const label = document.createElement("span");
      label.textContent = `${item.id} · ${item.title}`;
      marker.bindTooltip(label);
      marker.on("click", () => onSelect(item.id));
    });
    if (incidents.length)
      map.current.fitBounds(
        L.latLngBounds(incidents.map((item) => [item.lat, item.lng])),
        { padding: [45, 45], maxZoom: 14 },
      );
  }, [incidents, selectedId, onSelect]);
  return (
    <div
      ref={container}
      className="disaster-map"
      role="region"
      aria-label="แผนที่พิกัดเหตุที่บันทึก ไม่ใช่ตำแหน่งรถ GPS"
    />
  );
}
