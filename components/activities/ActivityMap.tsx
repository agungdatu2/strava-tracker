"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface Props { polyline: string; className?: string }

export function ActivityMap({ polyline, className }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || typeof window === "undefined") return;

    let map: import("leaflet").Map | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      // Inject leaflet CSS dynamically (avoids TS module issue for .css import)
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      const polylineLib = (await import("@mapbox/polyline")).default;
      const coords = polylineLib.decode(polyline) as [number, number][];
      if (!coords.length) return;

      map = L.map(mapRef.current!, { zoomControl: true, attributionControl: false });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const route = L.polyline(coords, { color: "#FC4C02", weight: 3.5, opacity: 0.9 }).addTo(map);
      map.fitBounds(route.getBounds(), { padding: [20, 20] });

      const dotIcon = (color: string) =>
        L.divIcon({
          html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,.4)"></div>`,
          className: "",
          iconSize: [10, 10],
        });
      L.marker(coords[0], { icon: dotIcon("#22C55E") }).addTo(map);
      L.marker(coords[coords.length - 1], { icon: dotIcon("#EF4444") }).addTo(map);
    })();

    return () => { map?.remove(); };
  }, [polyline]);

  return (
    <div style={{ isolation: "isolate" }} className={cn("w-full", className)}>
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
