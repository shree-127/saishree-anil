/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/useAppStore";
import { PhoneFrame } from "./components/shared/PhoneFrame";

// Citizen Pages
import { ReportPage } from "./pages/citizen/ReportPage";
import { DetailsPage } from "./pages/citizen/DetailsPage";
import { LiveFeedPage } from "./pages/citizen/LiveFeedPage";
import { StatusTrackerPage } from "./pages/citizen/StatusTrackerPage";
import { HelplinePage } from "./pages/citizen/HelplinePage";

// Responder Pages
import { ResponderRegisterPage } from "./pages/responder/ResponderRegisterPage";
import { ResponderDashboardPage } from "./pages/responder/ResponderDashboardPage";

// Operator Pages
import { OperatorDashboardPage } from "./pages/operator/OperatorDashboardPage";

export default function App() {
  const theme = useAppStore((state) => state.theme);

  // Apply dark mode class to root document element
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Citizen routes inside phone frame */}
        <Route
          path="/"
          element={
            <PhoneFrame showNav={true}>
              <ReportPage />
            </PhoneFrame>
          }
        />
        <Route
          path="/details"
          element={
            <PhoneFrame showNav={false}>
              <DetailsPage />
            </PhoneFrame>
          }
        />
        <Route
          path="/live"
          element={
            <PhoneFrame showNav={true}>
              <LiveFeedPage />
            </PhoneFrame>
          }
        />
        <Route
          path="/status"
          element={<Navigate to="/status/NR-2026-1042" replace />}
        />
        <Route
          path="/status/:id"
          element={
            <PhoneFrame showNav={true}>
              <StatusTrackerPage />
            </PhoneFrame>
          }
        />
        <Route
          path="/helpline"
          element={
            <PhoneFrame showNav={true}>
              <HelplinePage />
            </PhoneFrame>
          }
        />

        {/* Responder routes */}
        <Route
          path="/responder/register"
          element={
            <PhoneFrame showNav={false}>
              <ResponderRegisterPage />
            </PhoneFrame>
          }
        />
        <Route
          path="/responder"
          element={
            <PhoneFrame showNav={false}>
              <ResponderDashboardPage />
            </PhoneFrame>
          }
        />

        {/* Operator route (Full screen desktop) */}
        <Route path="/operator" element={<OperatorDashboardPage />} />

        {/* Fallback to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
