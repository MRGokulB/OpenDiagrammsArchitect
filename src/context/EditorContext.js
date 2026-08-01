"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

const EditorContext = createContext();

const MAX_HISTORY = 50;
const MAX_TABS = 20;

const createNewTab = (initialCode = "flowchart TD\n  A[Start Node] --> B{Decision}\n  B -->|Yes| C[(Database)]", fileName = "Untitled Diagram") => ({
  id: uuidv4(),
  fileName,
  code: initialCode,
  configStr: '{\n  "theme": "default",\n  "securityLevel": "loose"\n}',
  parsedConfig: { theme: "default", securityLevel: "loose" },
  historyStack: [initialCode],
  historyIndex: 0,
  configHistoryStack: ['{\n  "theme": "default",\n  "securityLevel": "loose"\n}'],
  configHistoryIndex: 0,
  isDirty: false,
  renderError: null,
  svgContent: "",
  createdAt: Date.now(),
  lastModified: Date.now(),
});

const initialState = {
  tabs: [],
  activeTabId: null,
  
  // UI State
  theme: "dark",
  zenMode: false,
  editorFullscreen: false,
  editorWidthRatio: 40, // percentage
  enableConfigTab: false,
  enableAiTab: false,
  
  // Modals & Menus
  showConfig: false,
  showDownloadMenu: false,
  showFiles: false,
  showTemplates: false,
  showShortcuts: false,
  showShare: false,
  
  // AI State
  prompt: "",
  apiKey: "",
  loading: false,
  aiResponse: "",
  aiModeType: "generate",
  lastAiMeta: null,

  // Toast
  toast: { show: false, message: "", type: "success" },

  // Internal
  isClient: false,
};

function editorReducer(state, action) {
  switch (action.type) {
    case "INIT_CLIENT":
      return { ...state, isClient: true, ...action.payload };
      
    // --- TAB MANAGEMENT ---
    case "CREATE_TAB": {
      if (state.tabs.length >= MAX_TABS) {
        return { ...state, toast: { show: true, message: `Max tabs (${MAX_TABS}) reached`, type: "error" } };
      }
      const newTab = action.payload || createNewTab();
      return {
        ...state,
        tabs: [...state.tabs, newTab],
        activeTabId: newTab.id,
      };
    }
    
    case "SET_ACTIVE_TAB":
      return { ...state, activeTabId: action.payload };
      
    case "CLOSE_TAB": {
      const tabIdToClose = action.payload;
      const newTabs = state.tabs.filter(t => t.id !== tabIdToClose);
      
      if (newTabs.length === 0) {
        const fallbackTab = createNewTab();
        return { ...state, tabs: [fallbackTab], activeTabId: fallbackTab.id };
      }
      
      let nextActiveId = state.activeTabId;
      if (state.activeTabId === tabIdToClose) {
        const closedIdx = state.tabs.findIndex(t => t.id === tabIdToClose);
        nextActiveId = newTabs[Math.min(closedIdx, newTabs.length - 1)].id;
      }
      
      return { ...state, tabs: newTabs, activeTabId: nextActiveId };
    }

    case "REORDER_TABS":
      return { ...state, tabs: action.payload };

    case "CLOSE_OTHER_TABS": {
      const tabToKeep = state.tabs.find(t => t.id === action.payload);
      return { ...state, tabs: [tabToKeep], activeTabId: tabToKeep.id };
    }

    case "CLOSE_TABS_TO_RIGHT": {
      const idx = state.tabs.findIndex(t => t.id === action.payload);
      const newTabs = state.tabs.slice(0, idx + 1);
      const isCurrentClosed = !newTabs.some(t => t.id === state.activeTabId);
      return { 
        ...state, 
        tabs: newTabs, 
        activeTabId: isCurrentClosed ? action.payload : state.activeTabId 
      };
    }

    case "DUPLICATE_TAB": {
      if (state.tabs.length >= MAX_TABS) return state;
      const sourceTab = state.tabs.find(t => t.id === action.payload);
      const newTab = { ...sourceTab, id: uuidv4(), fileName: `${sourceTab.fileName} (copy)`, isDirty: true };
      const idx = state.tabs.findIndex(t => t.id === action.payload);
      const newTabs = [...state.tabs];
      newTabs.splice(idx + 1, 0, newTab);
      return { ...state, tabs: newTabs, activeTabId: newTab.id };
    }
      
    // --- TAB CONTENT UPDATES ---
    case "UPDATE_ACTIVE_TAB": {
      return {
        ...state,
        tabs: state.tabs.map(t => 
          t.id === state.activeTabId 
            ? { ...t, ...action.payload, lastModified: Date.now() } 
            : t
        )
      };
    }

    case "UPDATE_TAB_CODE": {
      const { code, isHistoryUndoRedo = false } = action.payload;
      return {
        ...state,
        tabs: state.tabs.map(t => {
          if (t.id !== state.activeTabId) return t;
          
          let { historyStack, historyIndex } = t;
          if (!isHistoryUndoRedo) {
            if (historyStack[historyIndex] !== code) {
              const newStack = historyStack.slice(0, historyIndex + 1);
              newStack.push(code);
              if (newStack.length > MAX_HISTORY) newStack.shift();
              historyStack = newStack;
              historyIndex = newStack.length - 1;
            }
          }
          
          return { ...t, code, historyStack, historyIndex, isDirty: true, lastModified: Date.now() };
        })
      };
    }

    case "UPDATE_TAB_CONFIG": {
      const { configStr, parsedConfig, isHistoryUndoRedo = false } = action.payload;
      return {
        ...state,
        tabs: state.tabs.map(t => {
          if (t.id !== state.activeTabId) return t;
          
          let { configHistoryStack = [t.configStr], configHistoryIndex = 0 } = t;
          if (!isHistoryUndoRedo) {
            if (configHistoryStack[configHistoryIndex] !== configStr) {
              const newStack = configHistoryStack.slice(0, configHistoryIndex + 1);
              newStack.push(configStr);
              if (newStack.length > MAX_HISTORY) newStack.shift();
              configHistoryStack = newStack;
              configHistoryIndex = newStack.length - 1;
            }
          }
          
          const updates = { configStr, configHistoryStack, configHistoryIndex, isDirty: true, lastModified: Date.now() };
          if (parsedConfig) updates.parsedConfig = parsedConfig;
          
          return { ...t, ...updates };
        })
      };
    }

    case "UNDO": {
      const target = action.payload || "code";
      return {
        ...state,
        tabs: state.tabs.map(t => {
          if (t.id !== state.activeTabId) return t;
          if (target === "config") {
            const { configHistoryStack = [t.configStr], configHistoryIndex = 0 } = t;
            if (configHistoryIndex <= 0) return t;
            const newIdx = configHistoryIndex - 1;
            const newStr = configHistoryStack[newIdx];
            let parsed = t.parsedConfig;
            try { parsed = JSON.parse(newStr); } catch {}
            return { ...t, configHistoryIndex: newIdx, configStr: newStr, parsedConfig: parsed, isDirty: true, lastModified: Date.now() };
          } else {
            if (t.historyIndex <= 0) return t;
            const newIdx = t.historyIndex - 1;
            return { ...t, historyIndex: newIdx, code: t.historyStack[newIdx], isDirty: true, lastModified: Date.now() };
          }
        })
      };
    }

    case "REDO": {
      const target = action.payload || "code";
      return {
        ...state,
        tabs: state.tabs.map(t => {
          if (t.id !== state.activeTabId) return t;
          if (target === "config") {
            const { configHistoryStack = [t.configStr], configHistoryIndex = 0 } = t;
            if (configHistoryIndex >= configHistoryStack.length - 1) return t;
            const newIdx = configHistoryIndex + 1;
            const newStr = configHistoryStack[newIdx];
            let parsed = t.parsedConfig;
            try { parsed = JSON.parse(newStr); } catch {}
            return { ...t, configHistoryIndex: newIdx, configStr: newStr, parsedConfig: parsed, isDirty: true, lastModified: Date.now() };
          } else {
            if (t.historyIndex >= t.historyStack.length - 1) return t;
            const newIdx = t.historyIndex + 1;
            return { ...t, historyIndex: newIdx, code: t.historyStack[newIdx], isDirty: true, lastModified: Date.now() };
          }
        })
      };
    }

    // --- UI STATE ---
    case "SET_THEME":
      document.documentElement.setAttribute("data-theme", action.payload);
      localStorage.setItem("app_theme", action.payload);
      return { ...state, theme: action.payload };
      
    case "SET_UI_STATE":
      return { ...state, ...action.payload };

    case "SHOW_TOAST":
      return { ...state, toast: { show: true, message: action.payload.message, type: action.payload.type || "success" } };
      
    case "HIDE_TOAST":
      return { ...state, toast: { ...state.toast, show: false } };

    default:
      return state;
  }
}

export function EditorProvider({ children }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Auto-hide toast
  useEffect(() => {
    if (state.toast.show) {
      const timer = setTimeout(() => dispatch({ type: "HIDE_TOAST" }), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.toast.show]);

  // Client-side initialization
  useEffect(() => {
    let loadedTabs = [];
    let loadedActiveId = null;
    let editorRatio = 40;
    
    try {
      const savedTabs = localStorage.getItem("diagram_tabs");
      if (savedTabs) {
        loadedTabs = JSON.parse(savedTabs);
        loadedActiveId = localStorage.getItem("active_tab_id");
      } else {
        // Migration from old app version
        const oldDraft = localStorage.getItem("mermaid_draft");
        if (oldDraft) {
          loadedTabs = [createNewTab(oldDraft)];
        }
      }

      const savedRatio = localStorage.getItem("editor_width_ratio");
      if (savedRatio) {
        const parsed = parseFloat(savedRatio);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
          editorRatio = parsed;
        }
      }
      
      // Ensure editor is never permanently hidden due to bugs
      if (editorRatio < 20) editorRatio = 40;

      const savedTheme = localStorage.getItem("app_theme") || "dark";
      document.documentElement.setAttribute("data-theme", savedTheme);

      dispatch({
        type: "INIT_CLIENT",
        payload: {
          tabs: loadedTabs.length > 0 ? loadedTabs : [createNewTab()],
          activeTabId: loadedTabs.some(t => t.id === loadedActiveId) ? loadedActiveId : (loadedTabs[0]?.id || null),
          theme: savedTheme,
          editorWidthRatio: editorRatio,
          apiKey: localStorage.getItem("groq_api_key") || ""
        }
      });
    } catch (err) {
      console.error("Init failed", err);
      dispatch({ 
        type: "INIT_CLIENT", 
        payload: { tabs: [createNewTab()] }
      });
    }
  }, []);

  // Save to localStorage when tabs change
  useEffect(() => {
    if (state.isClient && state.tabs.length > 0) {
      const timer = setTimeout(() => {
        // Exclude huge SVGs or parsed configs from localStorage
        const tabsToSave = state.tabs.map(t => ({
          ...t,
          svgContent: "", 
          parsedConfig: {} 
        }));
        localStorage.setItem("diagram_tabs", JSON.stringify(tabsToSave));
        if (state.activeTabId) localStorage.setItem("active_tab_id", state.activeTabId);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.tabs, state.activeTabId, state.isClient]);

  const value = {
    state,
    activeTab: state.tabs.find(t => t.id === state.activeTabId) || state.tabs[0],
    dispatch,
    showNotification: (message, type = "success") => dispatch({ type: "SHOW_TOAST", payload: { message, type } }),
    updateActiveTab: (payload) => dispatch({ type: "UPDATE_ACTIVE_TAB", payload }),
    updateCode: (code) => dispatch({ type: "UPDATE_TAB_CODE", payload: { code } }),
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error("useEditor must be used within EditorProvider");
  return context;
};
