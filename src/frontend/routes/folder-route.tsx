"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useParams, useSearchParams } from "react-router";
import { Search, List, LayoutGrid, BookOpen, Rows3 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUIStore } from "@/store/bookmark-store";
import { AddBookmarkPopover } from "@/components/add-bookmark-popover";
import { BookmarkItem } from "@/components/bookmark-item";
import { Spinner } from "@/components/ui/spinner";

export function FolderRoute() {
  const [mounted, setMounted] = useState(false);
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const folderId = id as Id<"folders">;
  const { searchQuery, setSearchQuery, viewMode, setViewMode } = useUIStore();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const urlFolderName = searchParams.get("n");
  const folders = useQuery(api.folders.list) || [];
  const folder = folders.find((item) => item._id === folderId);
  const displayTitle = urlFolderName || folder?.name || "Loading...";

  const bookmarks = useQuery(api.bookmarks.list, { folderId });

  const filtered = bookmarks?.filter((bookmark) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      bookmark.title.toLowerCase().includes(query) ||
      bookmark.url.toLowerCase().includes(query) ||
      bookmark.description?.toLowerCase().includes(query)
    );
  });

  const pinnedBookmarks = filtered?.filter((bookmark) => bookmark.pinned) || [];
  const unpinnedBookmarks =
    filtered?.filter((bookmark) => !bookmark.pinned) || [];

  const activeViewMode = mounted ? viewMode : "grid";

  const toggleViewMode = () => {
    if (activeViewMode === "grid") setViewMode("list");
    else if (activeViewMode === "list") setViewMode("detailed");
    else setViewMode("grid");
  };

  return (
    <div className="max-w-3xl mx-auto md:p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{displayTitle}</h1>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleViewMode}>
            {activeViewMode === "grid" && <LayoutGrid className="h-5 w-5" />}
            {activeViewMode === "list" && <List className="h-5 w-5" />}
            {activeViewMode === "detailed" && <Rows3 className="h-5 w-5" />}
          </Button>
          <AddBookmarkPopover initialFolderId={folderId} />
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="search"
          placeholder={`Search in ${displayTitle}...`}
          className="pl-10"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      {bookmarks === undefined ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading bookmarks...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {pinnedBookmarks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                Pinned
              </h2>
              <div
                className={
                  activeViewMode === "grid"
                    ? "grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
                    : "space-y-3"
                }
              >
                {pinnedBookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark._id}
                    bookmark={bookmark}
                    viewMode={activeViewMode}
                    folderName={displayTitle}
                    folderColor={folder?.color}
                  />
                ))}
              </div>
            </div>
          )}

          <div
            className={
              activeViewMode === "grid"
                ? "grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4"
                : "space-y-3"
            }
          >
            {unpinnedBookmarks.length > 0
              ? unpinnedBookmarks.map((bookmark) => (
                  <BookmarkItem
                    key={bookmark._id}
                    bookmark={bookmark}
                    viewMode={activeViewMode}
                    folderName={displayTitle}
                    folderColor={folder?.color}
                  />
                ))
              : pinnedBookmarks.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>This folder is empty. Start adding some bookmarks!</p>
                  </div>
                )}
          </div>
        </div>
      )}
    </div>
  );
}
