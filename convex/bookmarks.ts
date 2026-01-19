import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { api } from "./_generated/api";
import * as cheerio from 'cheerio';
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { folderId: v.optional(v.id("folders")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const q = ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isDeleted"), false));

    if (args.folderId) {
      const bookmarks = await q.collect();
      return bookmarks.filter((b) => b.folderId === args.folderId);
    }
    return await q.order("desc").collect();
  },
});

export const listTrash = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isDeleted"), true))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.optional(v.string()),
    url: v.string(),
    description: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    pinned: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const bookmarkId = await ctx.db.insert("bookmarks", {
      ...args,
      userId,
      title: args.title || new URL(args.url).hostname,
      isDeleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Jalankan scraping di background ko, biar gak nungguin
    await ctx.scheduler.runAfter(0, api.bookmarks.scrapeMetadataAction, {
      id: bookmarkId,
      url: args.url,
    });

    return bookmarkId;
  },
});

export const updateMetadata = mutation({
  args: {
    id: v.id("bookmarks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ogImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const bookmark = await ctx.db.get(args.id);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const scrapeMetadataAction = action({
  args: { id: v.id("bookmarks"), url: v.string() },
  handler: async (ctx, args) => {
    try {
      const response = await fetch(args.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        },
      });

      if (!response.ok) return;

      const html = await response.text();
      const $ = cheerio.load(html);

      const title = $('meta[property="og:title"]').attr('content') || 
                    $('title').text().trim() || 
                    new URL(args.url).hostname;
      
      const description = $('meta[property="og:description"]').attr('content') || 
                          $('meta[name="description"]').attr('content') || '';
      
      let ogImage = $('meta[property="og:image"]').attr('content') || 
                    $('meta[name="twitter:image"]').attr('content') || '';

      // Fix relative image URL
      if (ogImage && !ogImage.startsWith('http')) {
        const urlObj = new URL(args.url);
        ogImage = `${urlObj.protocol}//${urlObj.host}${ogImage.startsWith('/') ? '' : '/'}${ogImage}`;
      }

      await ctx.runMutation(api.bookmarks.updateMetadataInternal, {
        id: args.id,
        title,
        description,
        ogImage,
      });
    } catch (error) {
      console.error("Background scraping failed:", error);
    }
  },
});

// internal mutation buat background task, biar gak kena check userId (karena action gak ada context user)
export const updateMetadataInternal = mutation({
  args: {
    id: v.id("bookmarks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    ogImage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const moveToTrash = mutation({
  args: { id: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const bookmark = await ctx.db.get(args.id);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { isDeleted: true, deletedAt: Date.now(), updatedAt: Date.now() });
  },
});

export const restoreFromTrash = mutation({
  args: { id: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const bookmark = await ctx.db.get(args.id);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { isDeleted: false, deletedAt: undefined, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("bookmarks") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const bookmark = await ctx.db.get(args.id);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});

export const togglePin = mutation({
  args: { id: v.id("bookmarks"), pinned: v.boolean() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const bookmark = await ctx.db.get(args.id);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { pinned: args.pinned, updatedAt: Date.now() });
  },
});

export const moveToFolder = mutation({
  args: { id: v.id("bookmarks"), folderId: v.optional(v.id("folders")) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const bookmark = await ctx.db.get(args.id);
    if (!bookmark || bookmark.userId !== userId) {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, { folderId: args.folderId, updatedAt: Date.now() });
  },
});