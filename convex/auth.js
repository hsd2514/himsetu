import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";

/**
 * Email + password sign-in. Accounts are provisioned by the seed (one per node),
 * so public sign-up is closed.
 */
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        if (params.flow === "signUp") throw new ConvexError("Sign-up is closed. Use an expedition account.");
        return { email: String(params.email).trim().toLowerCase() };
      },
    }),
  ],
});
