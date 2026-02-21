import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId) {
      return [];
    }

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
    return folders;
  },
});

export const getById = query({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId) return null;

    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== userId) return null;
    return folder;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const folderId = await ctx.db.insert("folders", {
      ...args,
      userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return folderId;
  },
});

export const update = mutation({
  args: {
    id: v.id("folders"),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const userId = identity?.subject;
    const folder = await ctx.db.get(args.id);
    if (!folder || folder.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
    // Unassign bookmarks that were in this folder
    const orphaned = await ctx.db
      .query("bookmarks")
      .withIndex("by_folder", (q) => q.eq("folderId", args.id))
      .collect();
    await Promise.all(
      orphaned.map((b) => ctx.db.patch(b._id, { folderId: undefined, updatedAt: Date.now() }))
    );
  },
});
