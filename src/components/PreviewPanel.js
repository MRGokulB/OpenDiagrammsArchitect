"use client";
import React, { useRef, useEffect } from "react";
import { useEditor } from "@/context/EditorContext";
import MermaidPreview from "./MermaidPreview";
import ExportMenu from "./ExportMenu";
import { Code, Clipboard, ChevronDown } from "lucide-react";

export default function PreviewPanel() {
  const { state, dispatch, activeTab, updateActiveTab, showNotification } = useEditor();
  const mermaidProxyRef = useRef(null);

  // Sync SVG content to active tab
  useEffect(() => {
    if (activeTab && mermaidProxyRef.current) {
      const currentSvg = activeTab.svgContent;
      const actualSvg = mermaidProxyRef.current.getSvgContent();
      if (actualSvg && currentSvg !== actualSvg) {
         updateActiveTab({ svgContent: actualSvg });
      }
    }
  }, [activeTab?.code, activeTab?.configStr]); // Check when code or config changes


  if (!state.isClient || !activeTab) return null;

  const copyToClipboard = async (text, msg) => {
    try {
      await navigator.clipboard.writeText(text);
      showNotification(msg || "Copied!");
    } catch {
      showNotification("Failed to copy", "error");
    }
  };

  const copyPngToClipboard = async () => {
    const svg = mermaidProxyRef.current?.getSvgContent();
    if (!svg) return showNotification("No diagram to copy", "error");
    try {
      showNotification("Rendering PNG...");
      // renderSvgToPngBase64 is now extracted to a utils file or handled in ExportMenu
      // For simplicity, we import it from the export logic or replicate the fixed logic here.
      // We will handle this in ExportMenu or a utility, but since we need it here:
      const { renderSvgToPngBase64 } = require("@/utils/exportUtils");
      const base64Png = await renderSvgToPngBase64(svg, state.theme);
      const res = await fetch(base64Png);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      showNotification("PNG copied to clipboard!");
    } catch (err) {
      showNotification(err.message || "Failed to copy PNG", "error");
    }
  };

  if (state.editorWidthRatio === 100) return null;

  return (
    <div className="panel preview-pane" style={{ flexBasis: `${100 - state.editorWidthRatio}%`, flexGrow: state.editorWidthRatio === 0 ? 1 : 0 }}>
      <div className="glass-header" style={{ padding: "0 1.25rem", minHeight: "38px", justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
          <select 
            className="theme-selector" 
            value={activeTab.parsedConfig.theme || "default"} 
            onChange={(e) => {
              const nc = { ...activeTab.parsedConfig, theme: e.target.value };
              updateActiveTab({ parsedConfig: nc, configStr: JSON.stringify(nc, null, 2) });
            }}
          >
            <option value="default">Default</option>
            <option value="dark">Dark</option>
            <option value="forest">Forest</option>
            <option value="neutral">Neutral</option>
          </select>

          <button className="btn-icon" onClick={() => copyToClipboard(activeTab.code, "Code copied!")} title="Copy Code"><Code size={14} /></button>
          <button className="btn-icon" onClick={copyPngToClipboard} title="Copy PNG"><Clipboard size={14} /></button>

          <div className="relative-wrapper">
            <button className="btn btn-primary" onClick={() => dispatch({ type: "SET_UI_STATE", payload: { showDownloadMenu: !state.showDownloadMenu } })}>
              Export <ChevronDown size={13} />
            </button>
            {state.showDownloadMenu && (
              <ExportMenu mermaidProxyRef={mermaidProxyRef} />
            )}
          </div>
        </div>
      </div>

      <MermaidPreview 
        ref={mermaidProxyRef} 
        code={activeTab.code} 
        config={activeTab.parsedConfig} 
        onSvgRendered={(svg) => updateActiveTab({ svgContent: svg })} 
        onError={(err) => updateActiveTab({ renderError: err })} 
      />
    </div>
  );
}
