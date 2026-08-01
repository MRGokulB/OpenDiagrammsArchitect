"use client";
import React from "react";
import { useEditor } from "@/context/EditorContext";
import { useFullscreen } from "@/hooks/useFullscreen";
import { useAutoSave } from "@/hooks/useAutoSave";
import TabBar from "./TabBar";
import { 
  Wand2, FolderOpen, Layers, Share2, Sun, Moon, HelpCircle, 
  Monitor, Maximize2, Minimize2, PanelLeftClose, PanelRightClose, Columns
} from "lucide-react";

export default function TopNavigation() {
  const { state, dispatch, activeTab } = useEditor();
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const { lastSaved, isDirty } = useAutoSave();

  if (!state.isClient) return null;

  const togglePanel = (panel) => {
    if (panel === "editor") {
      if (state.editorWidthRatio === 0) dispatch({ type: "SET_UI_STATE", payload: { editorWidthRatio: 40 } });
      else dispatch({ type: "SET_UI_STATE", payload: { editorWidthRatio: 0 } });
    } else if (panel === "preview") {
      if (state.editorWidthRatio === 100) dispatch({ type: "SET_UI_STATE", payload: { editorWidthRatio: 40 } });
      else dispatch({ type: "SET_UI_STATE", payload: { editorWidthRatio: 100 } });
    }
  };

  return (
    <div className="top-navigation">
      <div className="nav-brand">
        <Wand2 size={18} color="var(--accent)" /> 
        <span className="brand-text">ODA</span>
      </div>
      
      <div className="nav-tabs-wrapper">
        <TabBar />
      </div>

      <div className="nav-controls" style={{ display: "flex", alignItems: "center", gap: "0.25rem", flexWrap: "nowrap", flexShrink: 0, justifyContent: "flex-end" }}>
        {/* Auto Save Indicator */}
        <div className="auto-save-indicator" title={isDirty ? "Unsaved changes" : "All changes saved"}>
          <div className={`status-dot ${isDirty ? "dirty" : "saved"}`} />
        </div>

        <div className="nav-divider" />

        <button className="btn-icon" onClick={() => dispatch({ type: "SET_UI_STATE", payload: { showFiles: true } })} title="Files">
          <FolderOpen size={14} />
        </button>
        <button className="btn-icon" onClick={() => dispatch({ type: "SET_UI_STATE", payload: { showTemplates: true } })} title="Templates">
          <Layers size={14} />
        </button>
        
        <div className="nav-divider" />
        
        <button 
          className="btn-icon" 
          onClick={() => togglePanel("editor")} 
          title={state.editorWidthRatio === 0 ? "Show Editor" : "Collapse Editor"}
        >
          <PanelLeftClose size={16} style={{ transform: state.editorWidthRatio === 0 ? "scaleX(-1)" : "none" }} />
        </button>
        
        <button 
          className="btn-icon" 
          onClick={() => togglePanel("preview")} 
          title={state.editorWidthRatio === 100 ? "Show Preview" : "Collapse Preview"}
        >
          <PanelRightClose size={16} style={{ transform: state.editorWidthRatio === 100 ? "scaleX(-1)" : "none" }} />
        </button>

        <button 
          className="btn-icon" 
          onClick={() => dispatch({ type: "SET_UI_STATE", payload: { editorWidthRatio: 40 } })} 
          title="Reset Layout"
        >
          <Columns size={16} />
        </button>

        <div className="nav-divider" />

        <button 
          className="btn-icon" 
          onClick={() => dispatch({ type: "SET_THEME", payload: state.theme === "dark" ? "light" : "dark" })} 
          title="Toggle Theme"
        >
          {state.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        
        <button 
          className="btn-icon" 
          onClick={() => dispatch({ type: "SET_UI_STATE", payload: { showShortcuts: true } })} 
          title="Keyboard Shortcuts"
        >
          <HelpCircle size={16} />
        </button>
        
        <button 
          className="btn-icon" 
          onClick={toggleFullscreen} 
          title="Toggle Fullscreen (F11)"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
}
