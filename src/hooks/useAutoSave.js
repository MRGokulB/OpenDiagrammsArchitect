"use client";
import { useEffect, useState } from "react";
import { useEditor } from "@/context/EditorContext";

export function useAutoSave() {
  const { state } = useEditor();
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!state.isClient || state.tabs.length === 0) return;

    // Check if any tab is dirty
    const hasDirtyTabs = state.tabs.some(t => t.isDirty);
    if (!hasDirtyTabs) return;

    const timer = setTimeout(() => {
      setLastSaved(Date.now());
    }, 2000);

    return () => clearTimeout(timer);
  }, [state.tabs, state.isClient]);

  // Derive status
  const activeTab = state.tabs.find(t => t.id === state.activeTabId);
  const isDirty = activeTab?.isDirty || false;

  return { lastSaved, isDirty };
}
