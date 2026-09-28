import { signedInQuery } from "./authz";

export const list = signedInQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("stations").collect(),
});

