"use client";

import { useEffect } from "react";
import { initializeAxe } from "@/lib/axe";

/**
 * AxeInitializer mounts once in development mode to run react-axe
 * accessibility checks. It renders nothing to the DOM.
 */
export function AxeInitializer() {
  useEffect(() => {
    // Only initialise axe in development to avoid perf overhead in prod
    initializeAxe();
  }, []);

  return null;
}
