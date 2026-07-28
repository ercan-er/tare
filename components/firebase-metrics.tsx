"use client";

import { useEffect } from "react";
import { startMetrics } from "@/lib/metrics";

/**
 * Mounted once in the root layout. Boots Performance Monitoring and, when a
 * measurement id is present, Analytics. Renders nothing.
 */
export function FirebaseMetrics() {
  useEffect(() => {
    void startMetrics();
  }, []);
  return null;
}
