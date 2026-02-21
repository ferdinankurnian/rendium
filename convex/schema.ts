import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  bookmarks: defineTable({
    title: v.string(),
    url: v.string(),
    description: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    folderId: v.optional(v.id("folders")),
    pinned: v.boolean(),
    isDeleted: v.boolean(),
    deletedAt: v.optional(v.number()),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_folder", ["folderId"])
    .index("by_user_folder", ["userId", "folderId"])
    .index("by_pinned", ["pinned"])
    .index("by_status", ["isDeleted"]),

  folders: defineTable({
    name: v.string(),
    color: v.optional(v.string()),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),
});
