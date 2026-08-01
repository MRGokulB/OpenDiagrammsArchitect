"use client";
import React, { useState, useRef, useEffect } from "react";
import { useEditor } from "@/context/EditorContext";
import { jsPDF } from "jspdf";
import { Check, Download, ExternalLink } from "lucide-react";
import { renderSvgToPngBase64 } from "@/utils/exportUtils";

export default function ExportMenu({ mermaidProxyRef }) {
  const { state, dispatch, activeTab, showNotification } = useEditor();
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      // Don't close if clicking the toggle button
      if (menuRef.current && !menuRef.current.contains(e.target) && !e.target.closest('.btn-primary')) {
        dispatch({ type: "SET_UI_STATE", payload: { showDownloadMenu: false } });
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dispatch]);

  const saveToWorkspace = async (format) => {
    dispatch({ type: "SET_UI_STATE", payload: { showDownloadMenu: false } });
    showNotification("Saving...");
    try {
      let content = "";
      let encoding = "utf8";
      const actualSvg = mermaidProxyRef.current?.getSvgContent();

      if (format === "mmd") {
        content = activeTab.code;
      } else if (format === "svg") {
        if (!actualSvg) throw new Error("No SVG");
        content = actualSvg;
      } else if (format === "png" || format === "pdf") {
        if (!actualSvg) throw new Error("No SVG rendered");
        const base64Png = await renderSvgToPngBase64(actualSvg, state.theme);
        if (format === "pdf") {
          const pdf = new jsPDF({ orientation: "landscape" });
          pdf.addImage(base64Png, "PNG", 10, 10, 277, 190);
          content = pdf.output("datauristring").replace(/^data:application\/pdf;base64,/, "");
          encoding = "base64";
        } else {
          content = base64Png;
          encoding = "base64";
        }
      }

      const resp = await fetch("/api/files", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, extension: format, filename: activeTab.fileName, encoding }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error);
      showNotification(`Saved → ${data.name}`);
    } catch (err) {
      showNotification(err.message, "error");
    }
  };

  const exportToDevice = async (format) => {
    dispatch({ type: "SET_UI_STATE", payload: { showDownloadMenu: false } });
    showNotification("Preparing export...");
    try {
      const actualSvg = mermaidProxyRef.current?.getSvgContent();
      let content = "";
      let mimeType = "text/plain";

      if (format === "mmd") {
        content = activeTab.code;
        mimeType = "text/plain";
      } else if (format === "svg") {
        if (!actualSvg) throw new Error("No SVG rendered");
        content = actualSvg;
        mimeType = "image/svg+xml";
      } else if (format === "pdf" || format === "png") {
        if (!actualSvg) throw new Error("No SVG rendered");
        const base64Png = await renderSvgToPngBase64(actualSvg, state.theme);
        if (format === "pdf") {
          const pdf = new jsPDF({ orientation: "landscape" });
          pdf.addImage(base64Png, "PNG", 10, 10, 277, 190);
          content = pdf.output("arraybuffer");
          mimeType = "application/pdf";
        } else {
          const byteString = atob(base64Png.split(",")[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          content = ab;
          mimeType = "image/png";
        }
      }

      const safeName = (activeTab.fileName || "diagram").replace(/[^a-z0-9_-]/gi, "_");

      if (window.showSaveFilePicker) {
        const handle = await window.showSaveFilePicker({
          suggestedName: `${safeName}.${format}`,
          types: [{ description: "Diagram", accept: { [mimeType]: [`.${format}`] } }],
        });
        const writable = await handle.createWritable();
        await writable.write(content);
        await writable.close();
        showNotification("Exported to device!");
      } else {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${safeName}.${format}`;
        a.click();
        URL.revokeObjectURL(url);
        showNotification("Download started!");
      }
    } catch (e) {
      if (e.name !== "AbortError") showNotification(e.message, "error");
    }
  };

  return (
    <div ref={menuRef} className="download-menu" style={{ minWidth: "240px" }}>
      <p style={{ fontSize: "0.72rem", padding: "0.2rem 0.85rem", color: "var(--text-muted)", margin: 0 }}>Workspace</p>
      <button className="download-option" onClick={() => saveToWorkspace("mmd")}>
        <Check size={13} color="#3498db" /> Save .mmd
      </button>
      <div style={{ borderBottom: "1px solid var(--panel-border)", margin: "0.25rem 0" }} />
      <p style={{ fontSize: "0.72rem", padding: "0.2rem 0.85rem", color: "var(--text-muted)", margin: 0 }}>Export to Device</p>
      <button className="download-option" onClick={() => exportToDevice("pdf")}>
        <Download size={13} color="#e74c3c" /> PDF Document
      </button>
      <button className="download-option" onClick={() => exportToDevice("svg")}>
        <ExternalLink size={13} color="var(--green)" /> SVG Vector
      </button>
      <button className="download-option" onClick={() => exportToDevice("png")}>
        <ExternalLink size={13} color="var(--accent)" /> PNG Image
      </button>
    </div>
  );
}
