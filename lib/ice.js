/**
 * Candidate berths at the fast-ice edge. SIMULATED: positions are plausible
 * offload points and ice figures are demo values, standing in for a processed
 * ISRO EOS-04 / Sentinel-1 SAR ice classification.
 */
export const BERTHS = {
  MAITRI: [
    { id: "M1", name: "India Bay shelf edge", lat: -69.93, lon: 11.95, iceConc: 38, iceThickM: 1.4, distKm: 96 },
    { id: "M2", name: "Leningradsky Bay", lat: -69.62, lon: 12.9, iceConc: 62, iceThickM: 1.9, distKm: 134 },
    { id: "M3", name: "Western polynya", lat: -69.75, lon: 10.6, iceConc: 21, iceThickM: 0.9, distKm: 121 },
  ],
  BHARATI: [
    { id: "B1", name: "Quilty Bay approach", lat: -69.37, lon: 76.1, iceConc: 44, iceThickM: 1.6, distKm: 6 },
    { id: "B2", name: "Stornes lead", lat: -69.33, lon: 76.42, iceConc: 71, iceThickM: 2.2, distKm: 13 },
    { id: "B3", name: "Offshore anchorage", lat: -69.2, lon: 75.9, iceConc: 17, iceThickM: 0.6, distKm: 27 },
  ],
};

/**
 * 0 to 100, higher is better. Open water helps the ship, but a longer haul
 * means more helicopter sorties, so distance counts against the berth too.
 */
export function iceScore(b) {
  const ice = 100 - b.iceConc;
  const haul = Math.max(0, 100 - b.distKm * 0.6);
  const thick = b.iceThickM > 1.8 ? -10 : 0;
  return Math.round(Math.max(0, Math.min(100, ice * 0.6 + haul * 0.4 + thick)));
}

export function rankBerths(stationCode) {
  return BERTHS[stationCode].map((b) => ({ ...b, score: iceScore(b) })).sort((a, b) => b.score - a.score);
}

// Latest AMSR2 daily sea-ice concentration on NASA GIBS (that product ends on this date).
export const ICE_DATE = "2025-09-01";
