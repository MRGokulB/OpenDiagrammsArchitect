"use client";
import React, { useRef } from "react";
import { useEditor } from "@/context/EditorContext";
import { AI_PROMPTS } from "@/constants";
import { Zap, Sparkles, Wand2, Copy, LayoutDashboard } from "lucide-react";

export default function AIPanel() {
  const { state, dispatch, activeTab, updateActiveTab, showNotification } = useEditor();
  const lastRequestRef = useRef(0);

  const getCacheKey = (p, m) => {
    let hash = 0;
    const str = `${m}:${p}`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return `ai_cache_${hash}`;
  };

  const copyToClipboard = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(msg || "Copied!");
    } catch {
      showNotification("Failed to copy", "error");
    }
  };

  const executeAiProtocol = async (triggerMode) => {
    if (!state.apiKey) return showNotification("API Key required — click the key icon", "error");
    if (triggerMode === "generate" && !state.prompt.trim()) return showNotification("Enter a prompt first", "error");

    const now = Date.now();
    if (now - lastRequestRef.current < 3000) {
      return showNotification("Please wait between requests (rate limit)", "error");
    }
    lastRequestRef.current = now;

    const cacheInput = triggerMode === "expand" ? `expand:${activeTab.code}:${state.prompt}` : state.prompt;
    const cacheKey = getCacheKey(cacheInput, triggerMode);

    if (triggerMode !== "fix") {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          if (triggerMode === "explain" || triggerMode === "document") {
            dispatch({ type: "SET_UI_STATE", payload: { aiResponse: data.text } });
          } else {
            dispatch({ type: "UPDATE_TAB_CODE", payload: { code: data.code } });
          }
          showNotification("Loaded from cache ⚡");
          return;
        }
      } catch {}
    }

    dispatch({ type: "SET_UI_STATE", payload: { loading: true, aiResponse: "" } });
    
    try {
      let payload = { prompt: state.prompt, apiKey: state.apiKey, mode: triggerMode };

      if (triggerMode === "explain" || triggerMode === "document") {
        payload.codeToFix = activeTab.code;
        payload.mode = "explain";
      } else if (triggerMode === "expand") {
        payload.codeToFix = activeTab.code;
        payload.mode = "expand";
      } else if (triggerMode === "fix") {
        payload.prompt = activeTab.renderError || "Fix Flow Syntax";
        payload.codeToFix = activeTab.code;
        payload.mode = "fix";
      }

      const resp = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);

      if (triggerMode === "explain" || triggerMode === "document") {
        dispatch({ type: "SET_UI_STATE", payload: { aiResponse: data.text } });
        try { localStorage.setItem(cacheKey, JSON.stringify({ text: data.text })); } catch {}
        showNotification("Analysis compiled!");
      } else {
        dispatch({ type: "UPDATE_TAB_CODE", payload: { code: data.code } });
        try { localStorage.setItem(cacheKey, JSON.stringify({ code: data.code })); } catch {}
        showNotification("Diagram generated!");
      }

      if (data.model || data.tokens) {
        dispatch({ type: "SET_UI_STATE", payload: { lastAiMeta: { model: data.model, tokens: data.tokens } } });
      }
    } catch (err) { 
      showNotification(err.message, "error"); 
    } finally { 
      dispatch({ type: "SET_UI_STATE", payload: { loading: false } }); 
    }
  };

  return (
    <div className="ai-container">
      <div className="toolbar-row" style={{ marginBottom: "0.25rem" }}>
        <select 
          className="ai-input" 
          style={{ padding: "0.4rem", cursor: "pointer" }} 
          value={state.aiModeType} 
          onChange={(e) => dispatch({ type: "SET_UI_STATE", payload: { aiModeType: e.target.value } })}
        >
          <option value="generate">Generate New Diagram</option>
          <option value="expand">Expand Existing</option>
          <option value="document">Explain / Document</option>
        </select>
      </div>

      <div className="prompt-chips">
        {AI_PROMPTS.map((p) => (
          <button 
            key={p.label} 
            className="prompt-chip" 
            onClick={() => { 
              dispatch({ type: "SET_UI_STATE", payload: { prompt: p.prompt, aiModeType: "generate" } }); 
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <textarea 
        className="ai-input ai-textarea" 
        placeholder="Describe the diagram you want..." 
        value={state.prompt} 
        onChange={(e) => dispatch({ type: "SET_UI_STATE", payload: { prompt: e.target.value } })} 
        disabled={state.loading} 
      />

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button 
          className="btn btn-primary" 
          style={{ flex: "1", minWidth: "140px", justifyContent: "center" }} 
          onClick={() => executeAiProtocol(state.aiModeType)} 
          disabled={state.loading}
        >
          {state.loading ? <Zap size={15} className="loader" /> : <Sparkles size={14} />}
          {state.aiModeType === "generate" ? " Generate" : state.aiModeType === "expand" ? " Expand" : " Explain"}
        </button>
      </div>

      {activeTab?.renderError && (
        <button 
          className="btn" 
          onClick={() => executeAiProtocol("fix")} 
          disabled={state.loading} 
          style={{ borderColor: "var(--danger)", color: "var(--danger)", justifyContent: "center", marginTop: "0.75rem" }}
        >
          <Wand2 size={14} /> Auto-Fix Syntax Error
        </button>
      )}

      {state.aiResponse && (
        <div className="ai-response">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <strong style={{ color: "var(--accent)", fontSize: "0.82rem" }}>AI Analysis</strong>
            <button className="btn-icon" style={{ width: 26, height: 26 }} onClick={() => copyToClipboard(state.aiResponse, "Copied!")} title="Copy">
              <Copy size={12} />
            </button>
          </div>
          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{state.aiResponse}</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: "0.75rem", width: "100%", justifyContent: "center" }}
            disabled={state.loading}
            onClick={() => {
              dispatch({ type: "SET_UI_STATE", payload: { prompt: `Based on this analysis, generate a detailed Mermaid diagram:\n${state.aiResponse}`, aiModeType: "generate", aiResponse: "" } });
              setTimeout(() => executeAiProtocol("generate"), 50);
            }}
          >
            <LayoutDashboard size={14} /> Generate Diagram from Analysis
          </button>
        </div>
      )}
    </div>
  );
}
