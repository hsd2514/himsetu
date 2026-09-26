/**
 * Mission clock. In demo mode time runs `demoSpeed` times faster than the wall clock,
 * so a satellite pass 48 mission-minutes away arrives in 48 real seconds.
 * Passes are stored in mission time; the scheduler works in real time.
 */
export async function getSettings(ctx) {
  const s = await ctx.db.query("settings").first();
  return s ?? { demoSpeed: 60, demoStartTs: Date.now() };
}

export function missionNow(settings, realNow = Date.now()) {
  return settings.demoStartTs + (realNow - settings.demoStartTs) * settings.demoSpeed;
}

/** Real wall-clock time at which a given mission time is reached. */
export function realTimeFor(settings, missionTs, realNow = Date.now()) {
  const delta = (missionTs - missionNow(settings, realNow)) / settings.demoSpeed;
  return realNow + Math.max(0, delta);
}
