"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Moon,
  Sun,
  Monitor,
  Download,
  Trash2,
  Upload,
  Loader2,
  LogOut,
  User,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { useUser, useClerk } from "@clerk/nextjs";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useTheme } from "@/components/theme-provider";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const clerk = useClerk();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [importStatus, setImportStatus] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    trash: false,
    clearAll: false,
    import: false,
    signOut: false,
  });
  const bookmarks = useQuery(api.bookmarks.list, {}) || [];
  const trashBookmarks = useQuery(api.bookmarks.listTrash) || [];
  const folders = useQuery(api.folders.list) || [];

  const createFolder = useMutation(api.folders.create);
  const createBookmark = useMutation(api.bookmarks.create);
  const removePermanently = useMutation(api.bookmarks.remove);
  const removeFolder = useMutation(api.folders.remove);

  const maskEmail = (email?: string | null) => {
    if (!email) return "";
    const [local, domain] = email.split("@");
    if (local.length <= 2) return `${local[0]}***@${domain}`;
    return `${local.slice(0, 2)}***@${domain}`;
  };

  const handleSignOut = async () => {
    setLoadingStates((prev) => ({ ...prev, signOut: true }));
    try {
      await clerk.signOut({ redirectUrl: "/login" });
    } finally {
      setLoadingStates((prev) => ({ ...prev, signOut: false }));
    }
  };

  const handleExport = () => {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>\n`;

    folders.forEach((folder) => {
      html += `    <DT><H3 ADD_DATE="${Math.floor(folder.createdAt / 1000)}" LAST_MODIFIED="0"${folder.color ? ` COLOR="${folder.color}"` : ""}>${folder.name}</H3>\n`;
      html += `    <DL><p>\n`;

      const folderBookmarks = bookmarks.filter(
        (b) => b.folderId === folder._id,
      );
      folderBookmarks.forEach((b) => {
        html += `        <DT><A HREF="${b.url}" ADD_DATE="${Math.floor(b.createdAt / 1000)}">${b.title}</A>\n`;
      });

      html += `    </DL><p>\n`;
    });

    const validFolderIds = folders.map((f) => f._id);
    const unassigned = bookmarks.filter(
      (b) => !b.folderId || !validFolderIds.includes(b.folderId),
    );

    unassigned.forEach((b) => {
      html += `    <DT><A HREF="${b.url}" ADD_DATE="${Math.floor(b.createdAt / 1000)}">${b.title}</A>\n`;
    });

    html += `</DL><p>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rendium-bookmarks-${new Date().toISOString().split("T")[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingStates((prev) => ({ ...prev, import: true }));
    const reader = new FileReader();

    reader.onload = async (event) => {
      const content = event.target?.result as string;
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, "text/html");

        const folderCache: Record<string, string> = {};
        let importCount = 0;
        let currentFolderName = "";
        let currentFolderColor = "";

        // Walk through all DL elements recursively
        const walkDL = (dl: HTMLElement) => {
          let child = dl.firstElementChild;
          while (child) {
            if (child.tagName === "DT") {
              const h3 = child.querySelector("h3");
              const a = child.querySelector("a");
              const nestedDL = child.querySelector("dl");

              if (h3) {
                // This is a folder header
                currentFolderName = h3.textContent || "";
                currentFolderColor = h3.getAttribute("color") || "";
              }

              if (a) {
                // This is a bookmark
                const url = a.getAttribute("href") || "";
                const title = a.textContent || "";

                // Skip invalid or non-HTTP URLs
                try {
                  const parsed = new URL(url);
                  if (
                    parsed.protocol !== "http:" &&
                    parsed.protocol !== "https:"
                  )
                    return;
                } catch {
                  return;
                }

                // Save bookmark with current folder context
                bookmarksToImport.push({
                  url,
                  title,
                  folderName: currentFolderName,
                  folderColor: currentFolderColor,
                });
              }

              if (nestedDL) {
                // Recurse into nested folder
                const savedFolder = currentFolderName;
                const savedColor = currentFolderColor;
                walkDL(nestedDL as HTMLElement);
                // Restore parent folder context after returning from nested
                currentFolderName = savedFolder;
                currentFolderColor = savedColor;
              }
            }
            child = child.nextElementSibling;
          }
        };

        const bookmarksToImport: Array<{
          url: string;
          title: string;
          folderName: string;
          folderColor: string;
        }> = [];

        // Start from root DL
        const rootDL = doc.querySelector("dl");
        if (rootDL) {
          walkDL(rootDL as HTMLElement);
        }

        // Import all bookmarks
        for (const item of bookmarksToImport) {
          let folderId: Id<"folders"> | undefined = undefined;
          const systemFolders = [
            "Bookmarks bar",
            "Other bookmarks",
            "Mobile bookmarks",
            "Bookmarks",
          ];

          if (item.folderName && !systemFolders.includes(item.folderName)) {
            if (folderCache[item.folderName]) {
              folderId = folderCache[item.folderName] as Id<"folders">;
            } else {
              folderId = await createFolder({
                name: item.folderName,
                color: item.folderColor,
              });
              folderCache[item.folderName] = folderId;
            }
          }

          await createBookmark({
            url: item.url,
            title: item.title,
            pinned: false,
            folderId,
          });
          importCount++;
        }
        setImportStatus({
          title: "Import Successful",
          message: `Successfully imported ${importCount} bookmarks.`,
        });
      } catch (err) {
        console.error("Import failed:", err);
        setImportStatus({
          title: "Import Failed",
          message: "Make sure it is a valid HTML bookmark file.",
        });
      } finally {
        setLoadingStates((prev) => ({ ...prev, import: false }));
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleEmptyTrash = async () => {
    setLoadingStates((prev) => ({ ...prev, trash: true }));
    try {
      await Promise.all(
        trashBookmarks.map((b) => removePermanently({ id: b._id })),
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, trash: false }));
    }
  };

  const handleClearAllData = async () => {
    setLoadingStates((prev) => ({ ...prev, clearAll: true }));
    try {
      const allBookmarks = [...bookmarks, ...trashBookmarks];
      await Promise.all([
        ...allBookmarks.map((b) => removePermanently({ id: b._id })),
        ...folders.map((f) => removeFolder({ id: f._id })),
      ]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, clearAll: false }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto md:p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Settings</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Account Info
          </CardTitle>
          <CardDescription>Manage your account and session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full overflow-hidden border bg-muted flex items-center justify-center">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt={user.fullName || "User"}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-lg">
                  {user?.fullName || "Anonymous"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {maskEmail(user?.primaryEmailAddress?.emailAddress)}
                </p>
              </div>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sign Out</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to sign out of your account?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loadingStates.signOut}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleSignOut}
                    disabled={loadingStates.signOut}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loadingStates.signOut && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign Out
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" /> Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[
              { name: "light" as const, icon: Sun, label: "Light" },
              { name: "dark" as const, icon: Moon, label: "Dark" },
              { name: "system" as const, icon: Monitor, label: "System" },
            ].map(({ name, icon: Icon, label }) => (
              <Button
                key={name}
                variant={theme === name ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(name)}
              >
                <Icon className="h-4 w-4 mr-2" /> {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Data Management
          </CardTitle>
          <CardDescription>
            Export your data as HTML or import from a browser bookmark file
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" /> Export HTML
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="gap-2"
            disabled={loadingStates.import}
          >
            {loadingStates.import ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Import HTML
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".html"
            className="hidden"
          />
        </CardContent>
      </Card>

      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" /> Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <h3 className="font-medium">Empty Trash</h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete {trashBookmarks.length} items
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={trashBookmarks.length === 0 || loadingStates.trash}
                >
                  {loadingStates.trash && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Empty Trash
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {trashBookmarks.length}{" "}
                    items. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loadingStates.trash}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEmptyTrash}
                    disabled={loadingStates.trash}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loadingStates.trash && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Empty Trash
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
            <div className="space-y-0.5">
              <h3 className="font-medium text-destructive">Clear All Data</h3>
              <p className="text-sm text-muted-foreground">
                Delete all bookmarks and folders permanently
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  disabled={loadingStates.clearAll}
                >
                  {loadingStates.clearAll && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Clear All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete everything?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will wipe all your bookmarks and folders. You will lose
                    everything permanently.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={loadingStates.clearAll}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAllData}
                    disabled={loadingStates.clearAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {loadingStates.clearAll && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Clear All Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!importStatus}
        onOpenChange={(open) => !open && setImportStatus(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{importStatus?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {importStatus?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setImportStatus(null)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
