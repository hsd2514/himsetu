import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("refresh TLEs and passes", { hours: 6 }, internal.orbits.refresh, {});
crons.interval("keep pass horizon ahead of mission clock", { minutes: 2 }, internal.passes.ensureHorizon, {});
crons.interval("missed check-ins", { minutes: 1 }, internal.sos.checkMissed, {});

export default crons;
