// Users are managed by Clerk, no need for convex users table
// Clerk provides user data via useUser() hook on the client

import { query } from "./_generated/server";

export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId) {
      return null;
    }
    return { userId };
  },
});
