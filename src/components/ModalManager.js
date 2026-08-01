"use client";
import React, { useState, useEffect, useRef } from "react";
import { useEditor } from "@/context/EditorContext";
import { TEMPLATES, SHORTCUTS } from "@/constants";
import { 
  FolderOpen, X, Layers, HelpCircle, Share2, 
  FileCode2, Trash, Copy, Pencil, Check
} from "lucide-react";

// Generic Modal Wrapper
const Modal = ({ isOpen, onClose, title, icon: Icon, width = "520px", children }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Basic focus trap
      const focusable = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length > 0) focusable[0].focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="modal-content" style={{ width }} ref={modalRef}>
        <div className="modal-header">
          <h2 id="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0, fontSize: "1.1rem" }}>
            {Icon && <Icon size={18} />} {title}
          </h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function ModalManager() {
  const { state, dispatch, activeTab, updateActiveTab, updateCode, showNotification } = useEditor();
  const [workspaceFiles, setWorkspaceFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [renamingFile, setRenamingFile] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  // Files Modal
  const loadWorkspaceFiles = async () => {
    setIsLoadingFiles(true);
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) setWorkspaceFiles(data.files.filter((f) => f.name.endsWith(".mmd")));
    } catch {
      showNotification("Failed to fetch files", "error");
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (state.showFiles) loadWorkspaceFiles();
  }, [state.showFiles]);

  const loadSpecificFile = async (name) => {
    try {
      const res = await fetch("/api/files", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // If active tab is empty and not dirty, load into it. Otherwise, create a new tab.
      if (!activeTab.isDirty && activeTab.code === "flowchart TD\n") {
        updateActiveTab({ code: data.content, fileName: name.replace(".mmd", ""), isDirty: false });
        dispatch({ type: "UPDATE_TAB_CODE", payload: { code: data.content, isHistoryUndoRedo: true } }); // Set code without dirty flag side effects
      } else {
        dispatch({ 
          type: "CREATE_TAB", 
          payload: {
            id: Date.now().toString(),
            fileName: name.replace(".mmd", ""),
            code: data.content,
            configStr: '{\n  "theme": "default",\n  "securityLevel": "loose"\n}',
            parsedConfig: { theme: "default", securityLevel: "loose" },
            historyStack: [data.content],
            historyIndex: 0,
            isDirty: false,
            createdAt: Date.now(),
            lastModified: Date.now(),
          }
        });
      }
      
      dispatch({ type: "SET_UI_STATE", payload: { showFiles: false } });
      showNotification(`Loaded ${name}`);
    } catch (e) { 
      showNotification(e.message, "error"); 
    }
  };

  const deleteFile = async (name) => {
    if (!confirm(`Delete ${name} permanently?`)) return;
    try {
      await fetch(`/api/files?file=${encodeURIComponent(name)}`, { method: "DELETE" });
      loadWorkspaceFiles();
      showNotification("File deleted");
    } catch { 
      showNotification("Failed deleting file", "error"); 
    }
  };

  const startRenamingFile = (name) => {
    setRenamingFile(name);
    setRenameValue(name.replace(/\.mmd$/i, ""));
  };

  const renameFile = async () => {
    const nextName = renameValue.trim();
    if (!renamingFile || !nextName) return;

    try {
      const res = await fetch("/api/files", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: renamingFile, to: nextName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRenamingFile(null);
      setRenameValue("");
      loadWorkspaceFiles();
      showNotification(`Renamed to ${data.name}`);
    } catch (e) {
      showNotification(e.message, "error");
    }
  };

  // Templates
  const handleTemplateSelect = (t) => {
    if (activeTab.isDirty) {
      if (!confirm("This will overwrite your unsaved changes. Continue?")) return;
    }
    updateCode(t.code);
    dispatch({ type: "SET_UI_STATE", payload: { showTemplates: false } });
    showNotification(`${t.name} template loaded`);
  };

  // Share
  const shareUrlValue = typeof window !== 'undefined' && activeTab 
    ? `${window.location.origin}${window.location.pathname}#code=${btoa(unescape(encodeURIComponent(activeTab.code)))}` 
    : "";

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrlValue);
      showNotification("Link copied!");
    } catch {
      showNotification("Failed to copy link", "error");
    }
  };

  return (
    <>
      <Modal 
        isOpen={state.showFiles} 
        onClose={() => dispatch({ type: "SET_UI_STATE", payload: { showFiles: false } })}
        title="Workspace Files"
        icon={FolderOpen}
      >
        <div className="file-list">
          {isLoadingFiles ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>Loading...</p>
          ) : workspaceFiles.length === 0 ? (
            <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem" }}>No .mmd files found in workspace.</p>
          ) : (
            workspaceFiles.map((f) => (
              <div key={f.name} className="file-item">
                {renamingFile === f.name ? (
                  <div className="file-name file-rename-row">
                    <FileCode2 size={14} style={{ color: "var(--accent)" }} />
                    <input
                      className="file-rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") renameFile();
                        if (e.key === "Escape") setRenamingFile(null);
                      }}
                      autoFocus
                    />
                    <span className="file-extension">.mmd</span>
                  </div>
                ) : (
                  <div onClick={() => loadSpecificFile(f.name)} className="file-name">
                    <FileCode2 size={14} style={{ display: "inline", marginRight: "0.5rem", color: "var(--accent)" }} /> {f.name}
                  </div>
                )}
                <div className="file-actions">
                  {renamingFile === f.name ? (
                    <button className="btn-icon" onClick={renameFile} title="Save filename">
                      <Check size={14} />
                    </button>
                  ) : (
                    <>
                      <button className="btn" onClick={() => loadSpecificFile(f.name)}>Open</button>
                      <button className="btn-icon" onClick={() => startRenamingFile(f.name)} title="Rename file">
                        <Pencil size={14} />
                      </button>
                    </>
                  )}
                  <button className="btn-icon" style={{ color: "var(--danger)", borderColor: "var(--danger)" }} onClick={() => deleteFile(f.name)}>
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal 
        isOpen={state.showTemplates} 
        onClose={() => dispatch({ type: "SET_UI_STATE", payload: { showTemplates: false } })}
        title="Diagram Templates"
        icon={Layers}
        width="720px"
      >
        <div className="template-grid">
          {TEMPLATES.map((t) => (
            <button key={t.name} className="template-card" onClick={() => handleTemplateSelect(t)}>
              <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1rem" }}>{t.name}</h3>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>{t.desc}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal 
        isOpen={state.showShortcuts} 
        onClose={() => dispatch({ type: "SET_UI_STATE", payload: { showShortcuts: false } })}
        title="Keyboard Shortcuts"
        icon={HelpCircle}
      >
        <div className="shortcuts-grid">
          {SHORTCUTS.map((s) => (
            <div key={s.keys} className="shortcut-item">
              <span>{s.action}</span>
              <code className="kbd">{s.keys}</code>
            </div>
          ))}
        </div>
      </Modal>

      <Modal 
        isOpen={state.showShare} 
        onClose={() => dispatch({ type: "SET_UI_STATE", payload: { showShare: false } })}
        title="Share Diagram"
        icon={Share2}
        width="560px"
      >
        <div style={{ padding: "1.25rem" }}>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "0.75rem", marginTop: 0 }}>
            Anyone with this link can view and edit a copy of your diagram.
          </p>
          <div className="share-url-box" style={{ padding: 0 }}>
            <input className="share-url-input" value={shareUrlValue} readOnly onClick={(e) => e.target.select()} />
            <button className="btn btn-primary" onClick={copyShareLink}>
              <Copy size={14} /> Copy
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
