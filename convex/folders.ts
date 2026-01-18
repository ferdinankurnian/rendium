import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const folders = await ctx.db.query("folders").order("desc").collect();
    return folders;
  },
});

export const getById = query({
  args: { id: v.id("folders") },
  handler: async (ctx, args) => {
    const folder = await ctx.db.get(args.id);
    return folder;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const folderId = await ctx.db.insert("folders", {
      ...args,
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
    await ctx.db.delete(args.id);
  },
});