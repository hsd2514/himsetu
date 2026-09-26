/** Goa is shown in IST, everything south of the equator in UTC. */
export function fmtTime(ts, stationCode) {
  const tz = stationCode === "GOA" ? "Asia/Kolkata" : "UTC";
  const label = tz === "UTC" ? "UTC" : "IST";
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);
  return `${s} ${label}`;
}

export function fmtDate(ts) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short" }).format(ts);
}

export function fmtCountdown(ms) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function missionNow(settings, realNow = Date.now()) {
  if (!settings) return realNow;
  return settings.demoStartTs + (realNow - settings.demoStartTs) * settings.demoSpeed;
}
