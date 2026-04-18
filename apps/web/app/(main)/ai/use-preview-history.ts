"use client";

import type { CustomThemeVars } from "@/app/create/lib/custom-theme-vars";
import type { DesignSystemConfig } from "@/registry/config";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PreviewEntry = {
  config: DesignSystemConfig;
  customVars: CustomThemeVars | null;
  label: string; // e.g. "Default", preset name, "AI Generated"
};

export type PreviewHistory = {
  current: PreviewEntry;
  push: (entry: PreviewEntry) => void;
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  historyLength: number;
  currentPosition: number; // 1-based
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function entryKey(entry: PreviewEntry): string {
  return JSON.stringify({ config: entry.config, customVars: entry.customVars });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePreviewHistory(initialEntry: PreviewEntry): PreviewHistory {
  const entriesRef = useRef<PreviewEntry[]>([initialEntry]);
  const indexRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [maxIndex, setMaxIndex] = useState(0);

  // --- push ----------------------------------------------------------------

  const push = useCallback((entry: PreviewEntry) => {
    // Deduplicate: skip if identical to current entry
    const currentEntry = entriesRef.current[indexRef.current];
    if (currentEntry && entryKey(currentEntry) === entryKey(entry)) {
      return;
    }

    // Truncate any forward history beyond current position
    const nextEntries = entriesRef.current.slice(0, indexRef.current + 1);
    nextEntries.push(entry);
    entriesRef.current = nextEntries;

    const nextIndex = nextEntries.length - 1;
    indexRef.current = nextIndex;
    setIndex(nextIndex);
    setMaxIndex(nextIndex);
  }, []);

  // --- navigation ----------------------------------------------------------

  const canGoBack = index > 0;
  const canGoForward = index < maxIndex;

  const goBack = useCallback(() => {
    if (indexRef.current <= 0) return;
    const nextIndex = indexRef.current - 1;
    indexRef.current = nextIndex;
    setIndex(nextIndex);
  }, []);

  const goForward = useCallback(() => {
    if (indexRef.current >= entriesRef.current.length - 1) return;
    const nextIndex = indexRef.current + 1;
    indexRef.current = nextIndex;
    setIndex(nextIndex);
  }, []);

  // --- keyboard shortcuts --------------------------------------------------

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (!e.metaKey && !e.ctrlKey) return;

      // Skip when focused on editable elements
      if (
        (e.target instanceof HTMLElement && e.target.isContentEditable) ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // Redo: Cmd+Shift+Z or Ctrl+Y
      if ((key === "z" && e.shiftKey) || (key === "y" && e.ctrlKey)) {
        e.preventDefault();
        goForward();
        return;
      }

      // Undo: Cmd+Z or Ctrl+Z
      if (key === "z") {
        e.preventDefault();
        goBack();
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [goBack, goForward]);

  // --- return value --------------------------------------------------------

  const current = entriesRef.current[index] ?? initialEntry;

  return {
    current,
    push,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    historyLength: maxIndex + 1,
    currentPosition: index + 1,
  };
}
