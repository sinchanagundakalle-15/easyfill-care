import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Hospital } from "@/lib/data";

type Props = { hospitals: (Hospital & { distance?: number })[]; user?: { lat: number; lng: number } | null; radiusKm?: number; onSelect?: (id: string) => void; height?: number };

export default function HospitalMap({ hospitals, user, radiusKm, onSelect, height = 420 }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(el.current, { scrollWheelZoom: false }).setView([16.1, 74.5], 9);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(mapRef.current);
        layerRef.current = L.layerGroup().addTo(mapRef.current);
      }
      const map = mapRef.current, layer = layerRef.current!;
      layer.clearLayers();
      const pin = (color: string) => L.divIcon({ className: "", html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:3px solid white;box-shadow:0 4px 12px rgba(15,41,74,.35)"></div>`, iconSize: [28, 28], iconAnchor: [14, 28] });
      const pts: [number, number][] = [];
      hospitals.forEach((h) => {
        pts.push([h.lat, h.lng]);
        const m = L.marker([h.lat, h.lng], { icon: pin("#0F294A") }).addTo(layer);
        m.bindPopup(`<b>${h.name}</b><br/>★ ${h.rating}${h.distance != null ? ` · ${h.distance.toFixed(1)} km` : ""}`);
        if (onSelect) m.on("click", () => onSelect(h.id));
        if (user) L.polyline([[user.lat, user.lng], [h.lat, h.lng]], { color: "#19a7b8", weight: 1, dashArray: "4 6", opacity: 0.6 }).addTo(layer);
      });
      if (user) {
        pts.push([user.lat, user.lng]);
        L.circleMarker([user.lat, user.lng], { radius: 9, color: "white", weight: 3, fillColor: "#19a7b8", fillOpacity: 1 }).addTo(layer).bindPopup("You are here");
        if (radiusKm) L.circle([user.lat, user.lng], { radius: radiusKm * 1000, color: "#19a7b8", weight: 1, fillOpacity: 0.05 }).addTo(layer);
      }
      if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
      else if (pts.length === 1) map.setView(pts[0], 13);
    });
    return () => { cancelled = true; };
  }, [hospitals, user, radiusKm, onSelect]);

  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);
  return <div ref={el} style={{ height }} className="w-full overflow-hidden rounded-2xl border" />;
}
