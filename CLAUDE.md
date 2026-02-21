# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rendium is a bookmark manager built with Next.js 16, React 19, TypeScript, Tailwind CSS 4, Convex (backend), and Clerk (authentication).

## Development Commands

```bash
# Development server (runs Next.js + Convex dev simultaneously)
bun dev

# Build for production
bun run build

# Linting
bun run lint
```

## Architecture

### Stack
- **Framework**: Next.js 16 with App Router
- **UI**: shadcn/ui components (Tailwind CSS 4, new-york style)
- **Backend**: Convex (real-time database)
- **Auth**: Clerk (`@clerk/nextjs`)
- **State**: Zustand for UI state (`useUIStore`), Convex for server state
- **Icons**: Lucide React

### Route Structure
Routes use Next.js route groups:
- `(app)/` - Authenticated pages (requires login via Clerk middleware in layout.tsx)
- `(auth)/` - Login page (Clerk SignInButton)

Pages:
- `/` - All bookmarks
- `/folder/[id]` - Bookmarks filtered by folder
- `/trash` - Soft-deleted bookmarks
- `/settings` - Import/export, theme toggle
- `/login` - Google OAuth via Clerk

### Database (Convex)

Schema (`convex/schema.ts`):
- `bookmarks` - Stores bookmarks with soft-delete (`isDeleted`), pinning (`pinned`), optional `folderId`
- `folders` - User-created folders

Key patterns:
- All queries filter by `userId` from Clerk identity
- Soft delete: `isDeleted` + `deletedAt` fields, `listTrash` query
- Background metadata scraping via `scrapeMetadataAction` (uses cheerio)
- Indexes: `by_user`, `by_folder`, `by_user_folder`, `by_pinned`, `by_status`

Generated files at `convex/_generated/` - never edit manually.

### Auth Flow
- Clerk manages users (no users table in Convex)
- `convex/auth.config.ts` - Configures JWT verification with Clerk issuer
- `convex/users.ts` - Only has `viewer` query to get current userId from identity
- Server-side auth check: `await auth()` in `(app)/layout.tsx`
- Client-side auth: `ConvexProviderWithClerk` wraps the app

### State Management

Zustand store (`src/store/bookmark-store.ts`):
- `searchQuery` - Global search filter
- `activeFolder` - Currently selected folder
- `viewMode` - 'grid' | 'list' | 'detailed' (persisted to localStorage)

Convex queries are used directly in components via `useQuery(api.*.*)`.

### Key Components

- `BookmarkItem` - Displays bookmark with context menu (pin, move to folder, delete)
- `SidebarWrapper` / `SidebarContainer` - App shell with navigation
- `AddBookmarkPopover` - Create new bookmark with URL metadata fetch
- `AddFolderPopover` - Create folders
- `FolderItem` - Folder in sidebar with rename/delete context menu

### Metadata Scraping

Two paths:
1. Client-side: `/api/fetch-title/route.ts` - Cheerio scrape for preview during add
2. Server-side: `bookmarks.ts#scrapeMetadataAction` - Convex action that runs after bookmark creation to update title/description/ogImage

### Path Aliases
- `@/*` → `./src/*`
- `@/convex/*` → `./convex/*`

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_ISSUER_URL`
