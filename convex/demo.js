import { query } from "./_generated/server";

/**
 * Demo credentials for the sign-in page. Public on purpose: this is a hackathon
 * prototype and the team wants judges to sign in without asking. To hide the
 * password again, unset SHOW_DEMO_PASSWORD on the deployment
 * (npx convex env remove SHOW_DEMO_PASSWORD).
 */
export const credentials = query({
  args: {},
  handler: async () => ({
    password: process.env.SHOW_DEMO_PASSWORD === "1" ? process.env.DEMO_PASSWORD ?? null : null,
  }),
});
