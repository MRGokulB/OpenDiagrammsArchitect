"use client";
import { useEffect } from "react";
import { useEditor } from "@/context/EditorContext";
import { useFullscreen } from "./useFullscreen";

export function useKeyboardShortcuts() {
  const { state, dispatch, activeTab, updateActiveTab, showNotification } = useEditor();
  const { toggleFullscreen } = useFullscreen();

  useEffect(() => {
    if (!state.isClient) return;

    const handleKeyDown = async (e) => {
      const mod = e.ctrlKey || e.metaKey;
      
      // Ctrl + S (Save to disk)
      if (mod && e.key === "s") {
        e.preventDefault();
        if (activeTab) {
          showNotification("Saving diagram...");
          try {
            let fileName = activeTab.fileName;
            // Generate name if it's untitled and we have an API key
            if (fileName === "Untitled Diagram" && state.apiKey && activeTab.code.trim().length > 10) {
              const res = await fetch("/api/groq", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  prompt: activeTab.code,
                  apiKey: state.apiKey,
                  mode: "name"
                })
              });
              if (res.ok) {
                const data = await res.json();
                if (data.text && data.text !== "Untitled Diagram") {
                  fileName = data.text;
                }
              }
            }
            
            // Download as .mmd file
            const blob = new Blob([activeTab.code], { type: "text/plain" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = fileName.endsWith(".mmd") ? fileName : `${fileName}.mmd`;
            a.click();
            URL.revokeObjectURL(url);
            
            updateActiveTab({ isDirty: false, fileName });
            showNotification("Saved as " + (fileName.endsWith(".mmd") ? fileName : `${fileName}.mmd`));
          } catch (err) {
            console.error(err);
            showNotification("Failed to save", "error");
          }
        }
      }
      
      // Ctrl + Z (Undo)
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: "UNDO" });
        showNotification("Undo");
      }
      
      // Ctrl + Y or Ctrl + Shift + Z (Redo)
      if (mod && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: "REDO" });
        showNotification("Redo");
      }
      
      // F11 (Fullscreen)
      if (e.key === "F11") {
        e.preventDefault();
        toggleFullscreen();
      }
      
      // Ctrl + E (Toggle editor full width / Zen)
      if (mod && e.key === "e") {
        e.preventDefault();
        dispatch({ type: "SET_UI_STATE", payload: { editorFullscreen: !state.editorFullscreen } });
      }

      // Ctrl + T (New Tab)
      if (mod && e.key === "t") {
        e.preventDefault();
        dispatch({ type: "CREATE_TAB" });
      }

      // Ctrl + W (Close Tab)
      if (mod && e.key === "w") {
        e.preventDefault();
        if (state.activeTabId) {
          dispatch({ type: "CLOSE_TAB", payload: state.activeTabId });
        }
      }

      // Ctrl + Tab / Ctrl + Shift + Tab
      if (mod && e.key === "Tab") {
        e.preventDefault();
        const idx = state.tabs.findIndex(t => t.id === state.activeTabId);
        if (idx !== -1) {
          let nextIdx = e.shiftKey ? idx - 1 : idx + 1;
          if (nextIdx < 0) nextIdx = state.tabs.length - 1;
          if (nextIdx >= state.tabs.length) nextIdx = 0;
          dispatch({ type: "SET_ACTIVE_TAB", payload: state.tabs[nextIdx].id });
        }
      }

      // Ctrl + D (Copy Code)
      if (mod && e.key === "d") {
        e.preventDefault();
        if (activeTab?.code) {
          try {
            await navigator.clipboard.writeText(activeTab.code);
            showNotification("Code copied!");
          } catch {
            showNotification("Failed to copy code", "error");
          }
        }
      }

      // Esc (Close modals / Fullscreen editor)
      if (e.key === "Escape") {
        dispatch({ 
          type: "SET_UI_STATE", 
          payload: { 
            showConfig: false,
            showDownloadMenu: false,
            showFiles: false,
            showTemplates: false,
            showShortcuts: false,
            showShare: false,
            editorFullscreen: false
          } 
        });
      }

      // ? (Shortcuts)
      const tag = document.activeElement?.tagName;
      const isCm = document.activeElement?.classList?.contains("cm-content");
      if (e.key === "?" && !mod && tag !== "TEXTAREA" && tag !== "INPUT" && !isCm) {
        e.preventDefault();
        dispatch({ type: "SET_UI_STATE", payload: { showShortcuts: !state.showShortcuts } });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state, dispatch, activeTab, updateActiveTab, showNotification, toggleFullscreen]);
}
