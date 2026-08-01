"use client";
import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@/context/EditorContext";
import MermaidEditor from "./MermaidEditor";
import AIPanel from "./AIPanel";
import { 
  Undo2, Redo2, Maximize2, Minimize2, Key, Code, Settings, Zap,
  PlusSquare, ArrowRightLeft, Pipette, ChevronDown, Hash, Type, Wand2, HelpCircle,
  RotateCcw, Sparkles
} from "lucide-react";
import { SHAPES, FLOWS, PALETTES } from "@/constants";

export default function EditorPanel() {
  const { state, dispatch, activeTab, updateActiveTab, updateCode, showNotification } = useEditor();
  const [activeSubTab, setActiveSubTab] = useState("code");
  const [openToolbar, setOpenToolbar] = useState(null);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [configAiPrompt, setConfigAiPrompt] = useState("");
  const toolbarRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setOpenToolbar(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const fixWithAi = async () => {
    if (!state.apiKey) return showNotification("API Key required — click the key icon", "error");
    if (!activeTab.renderError) return showNotification("No syntax errors to fix");
    
    dispatch({ type: "SET_UI_STATE", payload: { loading: true } });
    showNotification("AI is fixing the syntax...");
    
    try {
      const resp = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: typeof activeTab.renderError === "object" ? (activeTab.renderError.message || JSON.stringify(activeTab.renderError)) : activeTab.renderError,
          codeToFix: activeTab.code,
          apiKey: state.apiKey,
          mode: "fix"
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      
      updateCode(data.code);
      showNotification("Code fixed successfully!");
      if (data.model || data.tokens) {
        dispatch({ type: "SET_UI_STATE", payload: { lastAiMeta: { model: data.model, tokens: data.tokens } } });
      }
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      dispatch({ type: "SET_UI_STATE", payload: { loading: false } });
    }
  };

  if (!state.isClient || !activeTab) return null;

  const handleUndo = () => {
    dispatch({ type: "UNDO" });
  };

  const handleRedo = () => {
    dispatch({ type: "REDO" });
  };

  const insertSnippet = (snippet) => {
    updateCode(activeTab.code + "\n  " + snippet);
    setOpenToolbar(null);
  };

  const handleConfigChange = (e) => {
    const val = e.target.value;
    try {
      const parsed = JSON.parse(val);
      dispatch({ type: "UPDATE_TAB_CONFIG", payload: { configStr: val, parsedConfig: parsed } });
    } catch {
      dispatch({ type: "UPDATE_TAB_CONFIG", payload: { configStr: val } });
    }
  };

  const handleConfigUndo = () => dispatch({ type: "UNDO", payload: "config" });
  const handleConfigRedo = () => dispatch({ type: "REDO", payload: "config" });
  const handleConfigReset = () => {
    const defaultStr = '{\n  "theme": "default",\n  "securityLevel": "loose"\n}';
    dispatch({ type: "UPDATE_TAB_CONFIG", payload: { configStr: defaultStr, parsedConfig: { theme: "default", securityLevel: "loose" } } });
  };

  const generateConfigWithAi = async () => {
    if (!state.apiKey) return showNotification("API Key required", "error");
    if (!configAiPrompt.trim()) return showNotification("Enter a prompt first", "error");
    
    dispatch({ type: "SET_UI_STATE", payload: { loading: true } });
    showNotification("AI is generating config...");
    
    try {
      const resp = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: configAiPrompt,
          apiKey: state.apiKey,
          mode: "config"
        }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      
      let configStr = data.text;
      configStr = configStr.replace(/```(?:json)?\s*([\s\S]*?)```/g, "$1").trim();
      
      try {
        const parsed = JSON.parse(configStr);
        dispatch({ type: "UPDATE_TAB_CONFIG", payload: { configStr: JSON.stringify(parsed, null, 2), parsedConfig: parsed } });
        showNotification("Config applied!");
      } catch {
        dispatch({ type: "UPDATE_TAB_CONFIG", payload: { configStr } });
        showNotification("Config generated, but contains syntax errors", "error");
      }
      
      setConfigAiPrompt("");
      if (data.model || data.tokens) {
        dispatch({ type: "SET_UI_STATE", payload: { lastAiMeta: { model: data.model, tokens: data.tokens } } });
      }
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      dispatch({ type: "SET_UI_STATE", payload: { loading: false } });
    }
  };

  const getDiagramStats = () => {
    const lines = activeTab.code.split("\n");
    const firstLine = lines[0]?.trim() || "";
    let type = "Unknown";
    const typeMap = {
      flowchart: "Flowchart", sequenceDiagram: "Sequence", classDiagram: "Class",
      "stateDiagram-v2": "State", stateDiagram: "State", erDiagram: "ER",
      gantt: "Gantt", pie: "Pie", mindmap: "Mindmap", gitGraph: "Git Graph",
    };
    for (const [key, val] of Object.entries(typeMap)) {
      if (firstLine.startsWith(key)) { type = val; break; }
    }
    return { type, lines: lines.length, chars: activeTab.code.length };
  };

  const stats = getDiagramStats();

  if (state.editorWidthRatio === 0) return null;

  return (
    <div className={`panel editor-pane ${state.editorFullscreen ? "fullscreen-active" : ""}`} style={{ flexBasis: `${state.editorWidthRatio}%`, flexGrow: state.editorWidthRatio === 100 ? 1 : 0 }}>
      <div className="glass-header" style={{ padding: "0 1.25rem", minHeight: "38px" }}>
        <div className="tabs-container" style={{ padding: 0, border: "none", background: "transparent" }}>
          <div className={`tab ${activeSubTab === "code" ? "active" : ""}`} onClick={() => setActiveSubTab("code")} style={{ padding: "0 0.75rem" }}><Code size={13} /> Code</div>
          {state.enableConfigTab && <div className={`tab ${activeSubTab === "config" ? "active" : ""}`} onClick={() => setActiveSubTab("config")} style={{ padding: "0 0.75rem" }}><Settings size={13} /> Config</div>}
          {state.enableAiTab && <div className={`tab ${activeSubTab === "ai" ? "active" : ""}`} onClick={() => setActiveSubTab("ai")} style={{ padding: "0 0.75rem" }}><Zap size={13} /> AI</div>}
        </div>
        <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
          <button className="btn-icon" onClick={handleUndo} title="Undo (Ctrl+Z)"><Undo2 size={14} /></button>
          <button className="btn-icon" onClick={handleRedo} title="Redo (Ctrl+Y)"><Redo2 size={14} /></button>
          <button className="btn-icon" onClick={() => dispatch({ type: "SET_UI_STATE", payload: { editorFullscreen: !state.editorFullscreen } })} title="Fullscreen (Ctrl+E)">
            {state.editorFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <div className="relative-wrapper">
            <button className="btn-icon" onClick={() => dispatch({ type: "SET_UI_STATE", payload: { showConfig: !state.showConfig } })} title="Preferences"><Key size={14} /></button>
            {state.showConfig && (
              <div className="download-menu" style={{ minWidth: "250px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-main)" }}>Preferences</span>
                  <span onClick={() => dispatch({ type: "SET_UI_STATE", payload: { showConfig: false } })} style={{ cursor: "pointer", color: "var(--danger)", fontSize: "0.78rem" }}>Close</span>
                </div>
                
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: "0.25rem" }}>Groq API Key</label>
                  <input
                    type="password" value={state.apiKey}
                    onChange={(e) => {
                      dispatch({ type: "SET_UI_STATE", payload: { apiKey: e.target.value } });
                      localStorage.setItem("groq_api_key", e.target.value);
                    }}
                    className="ai-input" placeholder="gsk_..."
                  />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={state.enableConfigTab} 
                      onChange={(e) => {
                        dispatch({ type: "SET_UI_STATE", payload: { enableConfigTab: e.target.checked } });
                        if (!e.target.checked && activeSubTab === "config") setActiveSubTab("code");
                      }} 
                    />
                    Show Config Tab
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.8rem", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={state.enableAiTab} 
                      onChange={(e) => {
                        dispatch({ type: "SET_UI_STATE", payload: { enableAiTab: e.target.checked } });
                        if (!e.target.checked && activeSubTab === "ai") setActiveSubTab("code");
                      }} 
                    />
                    Show AI Tab
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tab-content" style={{ display: activeSubTab === "code" ? "flex" : "none", position: "relative" }}>
        <MermaidEditor 
          value={activeTab.code} 
          onChange={(code) => updateCode(code)} 
          editorTheme={state.theme} 
        />

        {/* Floating Toolbar */}
        <div className="floating-toolbar" ref={toolbarRef}>
          {openToolbar && (
            <div className="floating-menu">
              {openToolbar === "shapes" && SHAPES.map((s) => (
                <button key={s.label} className="toolbar-btn" onClick={() => insertSnippet(s.snippet)}>
                  {s.label}
                </button>
              ))}
              {openToolbar === "flows" && FLOWS.map((f) => (
                <button key={f.label} className="toolbar-btn" onClick={() => insertSnippet(f.snippet)}>
                  {f.label}
                </button>
              ))}
              {openToolbar === "palettes" && (
                <>
                  <div className="toolbar-dropdown-colors">
                    {PALETTES.map((p) => (
                      <div key={p.name} className="toolbar-color-item" onClick={() => insertSnippet(`class NodeName ${p.name};`)}>
                        <div className="toolbar-color" style={{ background: p.color }} />
                        <span>{p.name}</span>
                      </div>
                    ))}
                  </div>
                  <button className="toolbar-btn" style={{ width: "100%" }} onClick={() => insertSnippet("classDef custom fill:#333,stroke:#fff,stroke-width:2px,color:#fff;")}>
                    <Pipette size={11} /> Custom ClassDef
                  </button>
                </>
              )}
            </div>
          )}
          
          <div className="floating-actions">
            <button className={`floating-btn ${openToolbar === "shapes" ? "active" : ""}`} onClick={() => setOpenToolbar(openToolbar === "shapes" ? null : "shapes")} title="Shapes">
              <PlusSquare size={16} />
            </button>
            <button className={`floating-btn ${openToolbar === "flows" ? "active" : ""}`} onClick={() => setOpenToolbar(openToolbar === "flows" ? null : "flows")} title="Flows">
              <ArrowRightLeft size={16} />
            </button>
            <button className={`floating-btn ${openToolbar === "palettes" ? "active" : ""}`} onClick={() => setOpenToolbar(openToolbar === "palettes" ? null : "palettes")} title="Palettes">
              <Pipette size={16} />
            </button>
            {activeTab.renderError && (
              <button className="floating-btn fix-btn" onClick={fixWithAi} title="Fix Syntax with AI" style={{ background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }}>
                <Wand2 size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="stats-bar">
          <div className="stat-item"><div className="stat-dot" /> {stats.type}</div>
          <div className="stat-item"><Hash size={10} /> {stats.lines} lines</div>
          <div className="stat-item"><Type size={10} /> {stats.chars} chars</div>
          {state.lastAiMeta && (
            <div className="stat-item" style={{ marginLeft: "auto" }}>
              <Zap size={10} /> {state.lastAiMeta.model?.replace(/-/g, " ")}
              {state.lastAiMeta.tokens && ` · ${state.lastAiMeta.tokens.total_tokens} tok`}
            </div>
          )}
        </div>
      </div>

      <div className="tab-content" style={{ display: activeSubTab === "config" ? "flex" : "none", padding: "1rem", flexDirection: "column", position: "relative" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>Advanced JSON Configuration</span>
          <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
            <button className="btn-icon" onClick={handleConfigUndo} title="Undo Config"><Undo2 size={14} /></button>
            <button className="btn-icon" onClick={handleConfigRedo} title="Redo Config"><Redo2 size={14} /></button>
            <button className="btn-icon" onClick={handleConfigReset} title="Reset to Default"><RotateCcw size={14} /></button>
            <button className="btn-icon" onClick={() => setShowConfigHelp(!showConfigHelp)} title="What is this?">
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
        {showConfigHelp && (
          <div style={{
            position: "absolute", top: "2.5rem", right: "1rem", width: "300px",
            background: "var(--panel-bg)", border: "1px solid var(--panel-border)", 
            padding: "1rem", borderRadius: "8px", zIndex: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}>
            <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "0.9rem" }}>Mermaid Config (JSON)</h4>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: "0 0 0.5rem 0", lineHeight: 1.4 }}>
              Use this to override advanced rendering settings like fonts, layout rules, and specific theme variables.
            </p>
            <div style={{ background: "var(--bg-color)", padding: "0.5rem", borderRadius: "4px", fontSize: "0.75rem", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
              {`{\n  "theme": "base",\n  "themeVariables": {\n    "primaryColor": "#ff0000"\n  },\n  "flowchart": {\n    "curve": "stepAfter"\n  }\n}`}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: "0.75rem", width: "100%", padding: "0.25rem" }} onClick={() => setShowConfigHelp(false)}>Close</button>
          </div>
        )}
        <textarea 
          className="ai-input ai-textarea" 
          style={{ height: "100%", flex: 1, marginBottom: "0.5rem" }} 
          value={activeTab.configStr} 
          onChange={handleConfigChange} 
          placeholder="Enter Mermaid JSON configuration..."
        />
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input 
            className="ai-input" 
            placeholder="E.g., Dark cyberpunk theme with neon green edges..." 
            value={configAiPrompt}
            onChange={(e) => setConfigAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") generateConfigWithAi(); }}
          />
          <button className="btn btn-primary" onClick={generateConfigWithAi} title="Generate Config">
            <Sparkles size={14} /> Generate
          </button>
        </div>
      </div>

      <div className="tab-content" style={{ display: activeSubTab === "ai" ? "flex" : "none" }}>
        <AIPanel />
      </div>
    </div>
  );
}
