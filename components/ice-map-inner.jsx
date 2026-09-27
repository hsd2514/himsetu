"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { ICE_DATE } from "@/lib/ice";

const GIBS = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/AMSRU2_Sea_Ice_Concentration_12km/default/${ICE_DATE}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`;

/** Station, candidate berths and a real sea-ice concentration overlay. */
export default function IceMapInner({ station, berths, bestId }) {
  return (
    <MapContainer
      key={station.code}
      center={[station.lat + 0.45, station.lon]}
      zoom={6}
      scrollWheelZoom={false}
      style={{ height: 420, width: "100%", borderRadius: 12, background: "#0a1628" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-tiles"
      />
      <TileLayer url={GIBS} maxNativeZoom={6} maxZoom={12} opacity={0.65} attribution="Sea ice: NASA GIBS AMSR2" />
      <CircleMarker center={[station.lat, station.lon]} radius={8} pathOptions={{ color: "#9fdcf5", fillColor: "#2aa8e0", fillOpacity: 1, weight: 2 }}>
        <Tooltip permanent direction="right" offset={[8, 0]}>{station.name}</Tooltip>
      </CircleMarker>
      {berths.map((b) => (
        <CircleMarker
          key={b.id}
          center={[b.lat, b.lon]}
          radius={b.id === bestId ? 10 : 7}
          pathOptions={{ color: "#e2e8f0", fillColor: b.id === bestId ? "#10b981" : "#475569", fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -8]} permanent={b.id === bestId}>
            {b.id} {b.name} · score {b.score}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
