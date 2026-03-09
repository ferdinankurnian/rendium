"use client";

import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { SidebarWrapper } from "@/components/sidebar-wrapper";
import { HomeRoute } from "@/frontend/routes/home-route";
import { FolderRoute } from "@/frontend/routes/folder-route";
import { TrashRoute } from "@/frontend/routes/trash-route";
import { SettingsRoute } from "@/frontend/routes/settings-route";
import { NotFoundRoute } from "@/frontend/routes/not-found-route";

export default function SpaApp() {
  return (
    <BrowserRouter>
      <SidebarWrapper>
        <Routes>
          <Route path="/" element={<HomeRoute />} />
          <Route path="/trash" element={<TrashRoute />} />
          <Route path="/settings" element={<SettingsRoute />} />
          <Route path="/folder/:id" element={<FolderRoute />} />
          <Route
            path="/static-app-shell"
            element={<Navigate to="/" replace />}
          />
          <Route path="*" element={<NotFoundRoute />} />
        </Routes>
      </SidebarWrapper>
    </BrowserRouter>
  );
}
