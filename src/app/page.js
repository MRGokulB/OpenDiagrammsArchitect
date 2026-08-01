"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import MermaidEditor from "@/components/MermaidEditor";
import MermaidPreview from "@/components/MermaidPreview";
import { jsPDF } from "jspdf";
import { 
  Wand2, Key, ChevronDown, Check, Code, 
  Settings, Sparkles, PlusSquare, Hexagon, Circle, 
  Database, Pipette, FolderOpen, Moon, Sun, Monitor, Type, ExternalLink, Download, Trash,
  Square, Layers, ArrowRightLeft, FileCode2, Zap
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("code");
  const [code, setCode] = useState("flowchart TD\n  A[Start Node] --> B{Decision}\n  B -->|Yes| C[(Database)]");
  const [configStr, setConfigStr] = useState('{\n  "theme": "default",\n  "securityLevel": "loose"\n}');
  const [parsedConfig, setParsedConfig] = useState({ theme: "default" });
  
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [aiModeType, setAiModeType] = useState("generate"); // generate, expand, document
  
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [showConfig, setShowConfig] = useState(false);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
  const [theme, setTheme] = useState("dark");
  const [zenMode, setZenMode] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [currentFileName, setCurrentFileName] = useState("Untitled Diagram");
  
  const mermaidProxyRef = useRef(null);
  const [svgContent, setSvgContent] = useState("");
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    const savedKey = localStorage.getItem("groq_api_key");
    if (savedKey) setApiKey(savedKey);
    const savedTheme = localStorage.getItem("app_theme") || "dark";
    applyTheme(savedTheme);
    const savedDraft = localStorage.getItem("mermaid_draft");
    if (savedDraft) setCode(savedDraft);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem("mermaid_draft", code);
    }, 2000);
    return () => clearTimeout(timer);
  }, [code]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToWorkspace("mmd", currentFileName);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, currentFileName]);

  const applyTheme = (t) => {
    setTheme(t);
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem("app_theme", t);
  };

  const handleConfigChange = (e) => {
    const val = e.target.value;
    setConfigStr(val);
    try { setParsedConfig(JSON.parse(val)); } catch {}
  };

  const showNotification = (msg, type = "success") => {
    setToast({ show: true, message: msg, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const loadWorkspaceFiles = async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if(data.files) setWorkspaceFiles(data.files.filter(f => f.name.endsWith('.mmd')));
    } catch (e) {
      showNotification("Failed to fetch files", "error");
    }
  };

  const openFileManager = () => {
    setShowFiles(true);
    loadWorkspaceFiles();
  };

  const loadSpecificFile = async (name) => {
    try {
      const res = await fetch("/api/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: name })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error);
      setCode(data.content);
      setCurrentFileName(name.replace('.mmd', ''));
      setShowFiles(false);
      showNotification(`Loaded ${name}`);
    } catch(e) {
      showNotification(e.message, "error");
    }
  };

  const deleteFile = async (name) => {
    if(!confirm(`Delete ${name} permanently?`)) return;
    try {
      await fetch(`/api/files?file=${encodeURIComponent(name)}`, { method: "DELETE" });
      loadWorkspaceFiles();
      showNotification("File deleted");
    } catch(e) {
      showNotification("Failed deleting file", "error");
    }
  };

  const executeAiProtocol = async (triggerMode) => {
    if (!apiKey) return showNotification("API Key Required for AI engine", "error");
    if (triggerMode === "generate" && !prompt.trim()) return showNotification("Please enter architectural prompt constraints", "error");

    setLoading(true); setAiResponse("");
    try {
      let payload = { prompt, apiKey, mode: triggerMode };
      
      if (triggerMode === "explain" || triggerMode === "document") {
        payload.prompt = code;
        payload.mode = "explain"; // Backend defaults to text output for explain
      } else if (triggerMode === "expand") {
        payload.codeToFix = code; 
        payload.mode = "generate"; // Inject old code into prompt
        payload.prompt = `Given this existing Mermaid code:\n\`\`\`\n${code}\n\`\`\`\nPlease strictly EXPAND and build upon it logically based on this directive: ${prompt}. Only output raw Mermaid code.`;
      } else if (triggerMode === "fix") { 
        payload.prompt = renderError || "Fix Flow Syntax"; 
        payload.codeToFix = code; 
      }

      const resp = await fetch("/api/groq", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);

      if (triggerMode === "explain" || triggerMode === "document") {
        setAiResponse(data.text);
        showNotification("Analysis Compiled!");
      } else {
        setCode(data.code);
        showNotification("Codebase Re-architected!");
      }
    } catch (err) { showNotification(err.message, "error"); }
    finally { setLoading(false); }
  };

  const saveToWorkspace = async (format, exactName = "") => {
    setShowDownloadMenu(false);
    showNotification("Saving document...");

    try {
      let content = ""; let encoding = "utf8";
      const actualSvg = mermaidProxyRef.current?.getSvgContent();

      if (format === "mmd") content = code;
      else if (format === "svg") { if (!actualSvg) throw new Error("No SVG"); content = actualSvg; }
      else if (format === "png" || format === "pdf") {
        if (!actualSvg) throw new Error("No SVG rendered");
        const base64Png = await renderSvgToPngBase64(actualSvg);
        if (format === "pdf") {
          const pdf = new jsPDF({ orientation: "landscape" });
          pdf.addImage(base64Png, 'PNG', 10, 10, 277, 190);
          content = pdf.output("datauristring").replace(/^data:application\/pdf;base64,/, "");
          encoding = "base64";
        } else {
          content = base64Png; encoding = "base64";
        }
      }

      const resName = exactName ? `${exactName}.mmd` : undefined;
      const resp = await fetch("/api/files", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, extension: format, filename: currentFileName, exactName: resName, encoding })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      showNotification(`Saved natively -> ${data.name}`);
    } catch (err) { showNotification(err.message, "error"); }
  };

  const renderSvgToPngBase64 = (svgString) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d"); const img = new Image();
      if(!svgString.match(/<svg[^\]]*?>/)) return reject(new Error("Invalid SVG"));
      
      canvas.width = 1600; canvas.height = 1200;
      ctx.fillStyle = theme === "dark" ? "#121214" : "#ffffff"; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const svgData = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
      
      img.onload = () => {
        const aspect = img.width / img.height;
        let dW = canvas.width; let dH = canvas.width / aspect;
        if (dH > canvas.height) { dH = canvas.height; dW = canvas.height * aspect; }
        ctx.drawImage(img, (canvas.width - dW)/2, (canvas.height - dH)/2, dW, dH);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => reject(new Error("Failed rendering Image"));
      img.src = svgData;
    });
  };

  const insertSnippet = (s) => setCode(p => p + "\n  " + s);

  return (
    <>
      <div className="top-navigation">
        <div className="nav-brand"><Wand2 size={24} color="var(--accent)"/> OpenDiagram Architect</div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          
          <input 
            className="ai-input" 
            style={{ width: "200px", padding: "0.4rem 0.8rem", height: "36px" }}
            value={currentFileName}
            onChange={(e) => setCurrentFileName(e.target.value)}
          />

          <button className="btn" onClick={openFileManager}><FolderOpen size={16}/> Workspace Explorer</button>
          
          <div style={{ borderLeft: "1px solid var(--panel-border)", height: "24px", margin: "0 0.5rem" }}></div>
          
          <button className="btn-icon" onClick={() => applyTheme(theme === "dark" ? "light" : "dark")} title="Toggle Theme">
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          <button className={`btn ${zenMode ? "btn-primary" : ""}`} onClick={() => setZenMode(!zenMode)} title="Excalidraw Zen Mode">
            <Monitor size={16}/> {zenMode ? "Exit Zen Canvas" : "Full Screen Canvas"}
          </button>
        </div>
      </div>

      <div className={`layout-container ${zenMode ? 'zen-mode' : ''}`}>
        <div className="panel editor-pane">
          <div className="glass-header">
            <h2>Visual Node Engine</h2>
            <div className="relative-wrapper">
              <button className="btn-icon" onClick={() => setShowConfig(!showConfig)} title="Hardware Integration Keys">
                <Key size={14} />
              </button>
              {showConfig && (
                <div className="download-menu" style={{ minWidth: "250px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Groq OS Key</p>
                    <span onClick={() => setShowConfig(false)} style={{ cursor: "pointer", color: "var(--danger)" }}>Close</span>
                  </div>
                  <input type="password" value={apiKey} onChange={(e) => {setApiKey(e.target.value); localStorage.setItem("groq_api_key", e.target.value)}} className="ai-input" placeholder="gsk_..." />
                </div>
              )}
            </div>
          </div>

          <div className="tabs-container">
            <div className={`tab ${activeTab === "code" ? "active" : ""}`} onClick={() => setActiveTab("code")}><Code size={14}/> Code</div>
            <div className={`tab ${activeTab === "config" ? "active" : ""}`} onClick={() => setActiveTab("config")}><Settings size={14}/> Config</div>
            <div className={`tab ${activeTab === "ai" ? "active" : ""}`} onClick={() => setActiveTab("ai")}><Zap size={14}/> AI Operations</div>
          </div>

          <div className="tab-content" style={{ display: activeTab === "code" ? "flex" : "none" }}>
            <div className="visual-toolbar">
              <div className="toolbar-row">
                <span className="toolbar-label">Shapes:</span>
                <button className="toolbar-btn" onClick={() => insertSnippet("N[Rectangle]")} title="Rectangle"><PlusSquare size={12}/></button>
                <button className="toolbar-btn" onClick={() => insertSnippet("N(Rounded Node)")} title="Rounded"><Circle size={12}/></button>
                <button className="toolbar-btn" onClick={() => insertSnippet("N[(Database)]")} title="Database"><Database size={12}/></button>
                <button className="toolbar-btn" onClick={() => insertSnippet("N{Decision}")} title="Decision"><Hexagon size={12}/></button>
                <button className="toolbar-btn" onClick={() => insertSnippet("N[[Subroutine]]")} title="Subroutine"><Layers size={12}/></button>
                <button className="toolbar-btn" onClick={() => insertSnippet("N[/Parallelogram/]")} title="Para Inline"><Square size={12}/></button>
                <button className="toolbar-btn" style={{marginLeft:"auto", color:"var(--danger)", borderColor:"var(--danger)"}} onClick={() => {if(confirm("Clear local?")) setCode("flowchart TD\n")}}>Reset</button>
              </div>
              <div className="toolbar-row">
                <span className="toolbar-label">Flows:</span>
                <button className="toolbar-btn" onClick={() => insertSnippet("--> B[Node]")}>Solid: --&gt;</button>
                <button className="toolbar-btn" onClick={() => insertSnippet("-.-> B[Node]")}>Dotted: -.-&gt;</button>
                <button className="toolbar-btn" onClick={() => insertSnippet("==> B[Node]")}>Thick: ==&gt;</button>
                <button className="toolbar-btn" onClick={() => insertSnippet("<--> B[Shared]")} title="Bi-Directional"><ArrowRightLeft size={12}/></button>
                <button className="toolbar-btn" onClick={() => insertSnippet("-- Label --> B[Node]")}><Type size={12}/> Label</button>
                <button className="toolbar-btn" onClick={() => insertSnippet("subgraph GroupName\n    Node1\n  end")}>+ Region</button>
              </div>
              <div className="toolbar-row">
                <span className="toolbar-label">Palettes:</span>
                <div className="toolbar-color" style={{background: "#0984e3"}} onClick={() => insertSnippet("class NodeName blue;")}></div>
                <div className="toolbar-color" style={{background: "#00b894"}} onClick={() => insertSnippet("class NodeName green;")}></div>
                <div className="toolbar-color" style={{background: "#e17055"}} onClick={() => insertSnippet("class NodeName orange;")}></div>
                <div className="toolbar-color" style={{background: "#9b59b6"}} onClick={() => insertSnippet("class NodeName purple;")}></div>
                <div className="toolbar-color" style={{background: "#f1c40f"}} onClick={() => insertSnippet("class NodeName yellow;")}></div>
                <div className="toolbar-color" style={{background: "#d63031"}} onClick={() => insertSnippet("class NodeName red;")}></div>
                <div className="toolbar-color" style={{background: "#636e72"}} onClick={() => insertSnippet("class NodeName gray;")}></div>
                <button className="toolbar-btn" onClick={() => insertSnippet("classDef custom fill:#333,stroke:#fff,stroke-width:2px,color:#fff;")}>
                  <Pipette size={12}/> Custom
                </button>
              </div>
            </div>
            <MermaidEditor value={code} onChange={setCode} />
          </div>

          <div className="tab-content" style={{ display: activeTab === "config" ? "flex" : "none", padding: "1rem" }}>
            <textarea className="ai-input ai-textarea" style={{height:"100%"}} value={configStr} onChange={handleConfigChange} />
          </div>

          <div className="tab-content" style={{ display: activeTab === "ai" ? "flex" : "none" }}>
            <div className="ai-container">
              
              <div className="toolbar-row" style={{marginBottom:"0.5rem"}}>
                 <select className="ai-input" style={{padding: "0.4rem", width: "100%", cursor: "pointer"}} value={aiModeType} onChange={(e) => setAiModeType(e.target.value)}>
                   <option value="generate">Mode: Draft New Application</option>
                   <option value="expand">Mode: Expand Existing Graph</option>
                   <option value="document">Mode: Write Technical Docs</option>
                 </select>
              </div>

              <textarea className="ai-input ai-textarea" placeholder="Input specific system directives for the LLM..." value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={loading} />
              
              <div className="ai-actions" style={{display:"flex", gap:"1rem", flexWrap:"wrap"}}>
                <button className="btn btn-primary" style={{flex:"1", minWidth:"150px"}} onClick={() => executeAiProtocol(aiModeType)} disabled={loading}>
                  {loading ? <Zap size={16} className="loader" /> : <Sparkles size={14} />} {aiModeType === "generate" ? "Architect From Scratch" : aiModeType === "expand" ? "Expand Capabilities" : "Publish Documentation"}
                </button>
              </div>
              
              <div className="toolbar-row" style={{marginTop:"0.5rem"}}>
                  {renderError && (
                    <button className="btn" onClick={() => executeAiProtocol("fix")} disabled={loading} style={{ borderColor: "var(--danger)", color: "var(--danger)", width: "100%", justifyContent: "center" }}>
                       <Wand2 size={14}/> Resolve Parsing Failure
                    </button>
                  )}
              </div>

              {aiResponse && (
                <div className="ai-response">
                  <strong style={{color:"var(--accent)"}}>Technical Output:</strong>
                  <p style={{marginTop:"0.5rem"}}>{aiResponse}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="panel preview-pane">
          {!zenMode && (
             <div className="glass-header">
               <h2>Live Architectural Preview</h2>
               <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
                 <select className="theme-selector" value={parsedConfig.theme || "default"} onChange={(e) => {
                     const nc = { ...parsedConfig, theme: e.target.value }; setParsedConfig(nc); setConfigStr(JSON.stringify(nc, null, 2));
                 }}>
                   <option value="default">Engine Theme: Native</option>
                   <option value="dark">Engine Theme: Dark</option>
                   <option value="forest">Engine Theme: Forest Structure</option>
                   <option value="neutral">Engine Theme: Neutral System</option>
                 </select>
                 
                 <div className="relative-wrapper">
                   <button className="btn btn-primary" onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
                      Export Engine <ChevronDown size={14} />
                   </button>
                   {showDownloadMenu && (
                     <div className="download-menu" style={{minWidth:"220px"}}>
                       <button className="download-option" onClick={() => saveToWorkspace("mmd", currentFileName)}><Check size={14} color="#3498db" /> Cache Local Project</button>
                       <button className="download-option" onClick={() => saveToWorkspace("pdf")}><Download size={14} color="#e74c3c" /> Publish Blueprint PDF</button>
                       <button className="download-option" onClick={() => saveToWorkspace("svg")}><ExternalLink size={14} color="var(--green)" /> Scalable Vector (SVG)</button>
                     </div>
                   )}
                 </div>
               </div>
             </div>
          )}
          
          {zenMode && (
             <div style={{ position: "absolute", top: "1rem", right: "2rem", zIndex: 100, display: "flex", gap: "1rem" }}>
               <button className="btn btn-primary" onClick={() => saveToWorkspace("mmd", currentFileName)} title="Quick Save Data">
                 <Check size={16}/> Save Native Protocol
               </button>
               <button className="btn" style={{background: "var(--panel-bg)"}} onClick={() => saveToWorkspace("pdf")}>Export PDF</button>
             </div>
          )}

          <MermaidPreview ref={mermaidProxyRef} code={code} config={parsedConfig} onSvgRendered={setSvgContent} onError={setRenderError} />
        </div>
      </div>

      {showFiles && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowFiles(false); }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}><FolderOpen size={20}/> Internal Project Storage Room</h2>
              <button className="btn-icon" onClick={() => setShowFiles(false)}>X</button>
            </div>
            <div className="file-list">
              {workspaceFiles.length === 0 ? (
                <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No structural .mmd files located in workspace engine.</p>
              ) : (
                workspaceFiles.map(f => (
                  <div key={f.name} className="file-item">
                    <div onClick={() => loadSpecificFile(f.name)} className="file-name">
                       <FileCode2 size={14} style={{display:"inline",marginRight:"0.5rem",color:"var(--accent)"}}/> {f.name}
                    </div>
                    <div className="file-actions">
                      <button className="btn" onClick={() => loadSpecificFile(f.name)}>Engage</button>
                      <button className="btn btn-icon" style={{color:"var(--danger)", borderColor:"var(--danger)"}} onClick={() => deleteFile(f.name)}><Trash size={14}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className={`toast ${toast.type === "error" ? "error" : ""} ${toast.show ? "show" : ""}`}>
        {toast.message}
      </div>
    </>
  );
}
