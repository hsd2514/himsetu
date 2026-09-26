"use client";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from "react-leaflet";

const ROUTE = ["GOA", "CPT", "SHIP", "MAITRI"];
const ROUTE2 = ["SHIP", "BHARATI"];

/**
 * Leaflet map. `stations` draws the resupply chain; `teams` and `sos` draw the
 * field picture with a line from an SOS to the nearest responder.
 */
export default function MapInner({ stations = [], teams = [], sos, center = [-25, 45], zoom = 2, height = 380 }) {
  const at = (code) => stations.find((s) => s.code === code);
  const line = (codes) => codes.map(at).filter(Boolean).map((s) => [s.lat, s.lon]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      worldCopyJump
      style={{ height, width: "100%", borderRadius: 12, background: "#0a1628" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="dark-tiles"
      />
      {stations.length > 0 && (
        <>
          <Polyline positions={line(ROUTE)} pathOptions={{ color: "#5cc4ef", weight: 2, dashArray: "6 6" }} />
          <Polyline positions={line(ROUTE2)} pathOptions={{ color: "#5cc4ef", weight: 2, dashArray: "6 6" }} />
        </>
      )}
      {stations.map((s) => (
        <CircleMarker
          key={s._id}
          center={[s.lat, s.lon]}
          radius={s.type === "hub" ? 9 : 7}
          pathOptions={{ color: "#9fdcf5", fillColor: s.type === "hub" ? "#2aa8e0" : "#0a1628", fillOpacity: 1, weight: 2 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>{s.name}</Tooltip>
        </CircleMarker>
      ))}
      {teams.map((t) => (
        <CircleMarker
          key={t._id}
          center={[t.lat, t.lon]}
          radius={6}
          pathOptions={{ color: "#e2e8f0", fillColor: t.kind === "vehicle" ? "#f59e0b" : "#10b981", fillOpacity: 1, weight: 1.5 }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {t.name} ({t.kind === "vehicle" ? "snow vehicle" : "on foot"})
          </Tooltip>
        </CircleMarker>
      ))}
      {sos && (
        <>
          {sos.nearest && (
            <Polyline
              positions={[[sos.lat, sos.lon], [sos.nearest.lat, sos.nearest.lon]]}
              pathOptions={{ color: "#ef4444", weight: 3 }}
            />
          )}
          <CircleMarker center={[sos.lat, sos.lon]} radius={10} pathOptions={{ color: "#fecaca", fillColor: "#dc2626", fillOpacity: 1, weight: 2 }}>
            <Tooltip permanent direction="right" offset={[10, 0]}>SOS</Tooltip>
          </CircleMarker>
        </>
      )}
    </MapContainer>
  );
}
