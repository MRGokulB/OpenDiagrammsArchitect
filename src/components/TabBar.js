"use client";
import React, { useRef, useState } from "react";
import { useEditor } from "@/context/EditorContext";
import { Plus, X, Circle, FileCode2 } from "lucide-react";

export default function TabBar() {
  const { state, dispatch, activeTab } = useEditor();
  const [editingTabId, setEditingTabId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef(null);
  const [draggedTab, setDraggedTab] = useState(null);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, tabId: null });

  if (!state.isClient) return null;

  const handleDragStart = (e, tab) => {
    setDraggedTab(tab);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
    e.target.style.opacity = "0.5";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetTab) => {
    e.preventDefault();
    e.currentTarget.style.opacity = "1";
    if (!draggedTab || draggedTab.id === targetTab.id) return;

    const newTabs = [...state.tabs];
    const draggedIdx = newTabs.findIndex(t => t.id === draggedTab.id);
    const targetIdx = newTabs.findIndex(t => t.id === targetTab.id);

    newTabs.splice(draggedIdx, 1);
    newTabs.splice(targetIdx, 0, draggedTab);

    dispatch({ type: "REORDER_TABS", payload: newTabs });
    setDraggedTab(null);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedTab(null);
  };

  const startEditing = (tab) => {
    setEditingTabId(tab.id);
    setEditValue(tab.fileName);
    setTimeout(() => inputRef.current?.select(), 50);
  };

  const finishEditing = () => {
    if (!editingTabId) return;
    const newName = editValue.trim() || "Untitled Diagram";
    const tabIdx = state.tabs.findIndex(t => t.id === editingTabId);
    if (tabIdx !== -1) {
      const newTabs = [...state.tabs];
      newTabs[tabIdx] = { ...newTabs[tabIdx], fileName: newName, lastModified: Date.now() };
      dispatch({ type: "REORDER_TABS", payload: newTabs });
    }
    setEditingTabId(null);
  };

  const handleContextMenu = (e, tabId) => {
    e.preventDefault();
    setContextMenu({ show: true, x: e.clientX, y: e.clientY, tabId });
  };

  const closeContextMenu = () => {
    setContextMenu({ ...contextMenu, show: false });
  };

  return (
    <div className="tab-bar-container" onClick={closeContextMenu}>
      <div className="tab-bar">
        {state.tabs.map((tab) => {
          const isActive = tab.id === state.activeTabId;
          const isEditing = tab.id === editingTabId;
          
          return (
            <div
              key={tab.id}
              className={`chrome-tab ${isActive ? "active" : ""}`}
              draggable={!isEditing}
              onDragStart={(e) => handleDragStart(e, tab)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, tab)}
              onDragEnd={handleDragEnd}
              onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: tab.id })}
              onDoubleClick={() => startEditing(tab)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              onAuxClick={(e) => {
                if (e.button === 1) { // Middle click
                  e.preventDefault();
                  dispatch({ type: "CLOSE_TAB", payload: tab.id });
                }
              }}
            >
              <div className="tab-background">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 120 36" preserveAspectRatio="none">
                  <path d="M0 36 L12 36 C12 36 12 24 24 24 L96 24 C108 24 108 36 108 36 L120 36 L120 36 L120 0 L0 0 Z" className="tab-svg-path" />
                </svg>
              </div>
              <div className="chrome-tab-content">
                <FileCode2 size={13} className="tab-icon" />
                
                {isEditing ? (
                  <input
                    ref={inputRef}
                    className="tab-input"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={finishEditing}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") finishEditing();
                      if (e.key === "Escape") setEditingTabId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="tab-title" title={tab.fileName}>{tab.fileName}</span>
                )}

                <div className="tab-actions">
                  {tab.isDirty && !isActive && <Circle size={8} className="dirty-dot" />}
                  {tab.isDirty && isActive && <Circle size={8} className="dirty-dot hover-hide" />}
                  <button 
                    className="tab-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: "CLOSE_TAB", payload: tab.id });
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        
        <button 
          className="new-tab-btn" 
          onClick={() => dispatch({ type: "CREATE_TAB" })}
          title="New Tab (Ctrl+T)"
        >
          <Plus size={16} />
        </button>
      </div>

      {contextMenu.show && (
        <div 
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => { dispatch({ type: "CLOSE_TAB", payload: contextMenu.tabId }); closeContextMenu(); }}>Close Tab</button>
          <button onClick={() => { dispatch({ type: "CLOSE_OTHER_TABS", payload: contextMenu.tabId }); closeContextMenu(); }}>Close Other Tabs</button>
          <button onClick={() => { dispatch({ type: "CLOSE_TABS_TO_RIGHT", payload: contextMenu.tabId }); closeContextMenu(); }}>Close Tabs to the Right</button>
          <div className="menu-divider" />
          <button onClick={() => { dispatch({ type: "DUPLICATE_TAB", payload: contextMenu.tabId }); closeContextMenu(); }}>Duplicate Tab</button>
        </div>
      )}
    </div>
  );
}
