"use client";

import { Link } from "react-router";
import { Compass } from "lucide-react";

export function NotFoundRoute() {
  return (
    <div className="max-w-3xl mx-auto md:p-6 py-16 text-center text-muted-foreground space-y-4">
      <Compass className="h-12 w-12 mx-auto opacity-50" />
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Page not found
        </h1>
        <p>This route is not part of the SPA shell.</p>
      </div>
      <Link
        to="/"
        className="inline-flex text-primary hover:underline underline-offset-4"
      >
        Back to bookmarks
      </Link>
    </div>
  );
}
