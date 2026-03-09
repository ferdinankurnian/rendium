"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Trash2 } from "lucide-react";
import { useUIStore } from "@/store/bookmark-store";
import { BookmarkItem } from "@/components/bookmark-item";
import { Spinner } from "@/components/ui/spinner";

export default function TrashPage() {
  const [mounted, setMounted] = useState(false);
  const { viewMode } = useUIStore();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const trashBookmarks = useQuery(api.bookmarks.listTrash);
  const activeViewMode = mounted ? viewMode : "grid";

  return (
    <div className="max-w-3xl mx-auto md:p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Trash</h1>
      </header>

      <p className="text-muted-foreground text-sm">
        Bookmarks here will be permanently deleted when you empty the trash.
      </p>

      {trashBookmarks === undefined ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <Spinner className="size-8" />
          <p className="text-sm text-muted-foreground">Loading trash...</p>
        </div>
      ) : trashBookmarks.length > 0 ? (
        <div
          className={
            activeViewMode === "grid"
              ? "columns-2 lg:columns-3"
              : "space-y-3"
          }
        >
          {trashBookmarks.map((bookmark) => (
            <BookmarkItem
              key={bookmark._id}
              bookmark={bookmark}
              viewMode={activeViewMode}
              isTrashView={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Your trash is empty.</p>
        </div>
      )}
    </div>
  );
}
