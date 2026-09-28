/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as accountsDb from "../accountsDb.js";
import type * as auth from "../auth.js";
import type * as authz from "../authz.js";
import type * as clock from "../clock.js";
import type * as crates from "../crates.js";
import type * as crons from "../crons.js";
import type * as data_iridiumTle from "../data/iridiumTle.js";
import type * as demo from "../demo.js";
import type * as forecast from "../forecast.js";
import type * as geo from "../geo.js";
import type * as http from "../http.js";
import type * as inventory from "../inventory.js";
import type * as link from "../link.js";
import type * as messages from "../messages.js";
import type * as orbits from "../orbits.js";
import type * as passes from "../passes.js";
import type * as people from "../people.js";
import type * as seed from "../seed.js";
import type * as sos from "../sos.js";
import type * as stations from "../stations.js";
import type * as weather from "../weather.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  accountsDb: typeof accountsDb;
  auth: typeof auth;
  authz: typeof authz;
  clock: typeof clock;
  crates: typeof crates;
  crons: typeof crons;
  "data/iridiumTle": typeof data_iridiumTle;
  demo: typeof demo;
  forecast: typeof forecast;
  geo: typeof geo;
  http: typeof http;
  inventory: typeof inventory;
  link: typeof link;
  messages: typeof messages;
  orbits: typeof orbits;
  passes: typeof passes;
  people: typeof people;
  seed: typeof seed;
  sos: typeof sos;
  stations: typeof stations;
  weather: typeof weather;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
