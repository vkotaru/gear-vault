import { useState } from "react";

export type ViewMode = "tiles" | "compact" | "list";

const VALID: ViewMode[] = ["tiles", "compact", "list"];

/**
 * View-mode preference persisted to localStorage per page key.
 */
export function useViewMode(storageKey: string, initial: ViewMode = "tiles") {
  const [view, setViewState] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return initial;
    const saved = window.localStorage.getItem(storageKey) as ViewMode | null;
    return saved && VALID.includes(saved) ? saved : initial;
  });

  const setView = (v: ViewMode) => {
    setViewState(v);
    try {
      window.localStorage.setItem(storageKey, v);
    } catch {
      /* ignore storage failures */
    }
  };

  return [view, setView] as const;
}
