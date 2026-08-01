"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from "react";
import mermaid from "mermaid";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, Maximize, Target } from "lucide-react";

const MermaidPreview = forwardRef(({ code, config, onSvgRendered, onError }, ref) => {
  const containerRef = useRef(null);
  const [localError, setLocalError] = useState(null);

  useImperativeHandle(ref, () => ({
    getSvgContent: () => containerRef.current?.innerHTML || ""
  }));

  useEffect(() => {
    let isMounted = true;
    
    const renderDiagram = async () => {
      try {
        if (!code || !code.trim() || !containerRef.current) return;
        
        setLocalError(null);
        if (onError) onError(null);
        containerRef.current.innerHTML = "";
        
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "loose",
          fontFamily: "Inter, sans-serif"
        });
        
        let safeConfig = { ...config, theme: config.theme || "default" };
        const directive = `%%{init: ${JSON.stringify(safeConfig)}}%%\n`;
        const codeWithTheme = code.trim().startsWith('%%{init:') ? code : directive + code;
        
        const id = `mermaid-svg-${Date.now()}`;
        const { svg } = await mermaid.render(id, codeWithTheme);
        
        if (isMounted && containerRef.current) {
          containerRef.current.innerHTML = svg;
          if (onSvgRendered) {
             onSvgRendered(svg);
          }
        }
      } catch (err) {
        if (isMounted) {
          const errMsg = err.message || "Syntax error in Mermaid flowchart";
          setLocalError(errMsg);
          if (onError) onError(errMsg);
        }
      }
    };

    const debounceId = setTimeout(() => {
      renderDiagram();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(debounceId);
    };
  }, [code, config, onSvgRendered, onError]);

  return (
    <div className="preview-container" style={{ position: "relative", width: "100%", height: "100%" }}>
      {localError && (
        <div style={{ color: "var(--danger)", background: "rgba(255, 118, 117, 0.1)", padding: "1rem", borderRadius: "8px", position: "absolute", bottom: "1rem", right: "1rem", maxWidth: "400px", zIndex: 10 }}>
          <strong>Error:</strong> {localError}
        </div>
      )}
      
      <TransformWrapper
        initialScale={1}
        minScale={0.1}
        maxScale={8}
        centerOnInit={true}
        wheel={{ step: 0.1 }}
      >
        {({ zoomIn, zoomOut, resetTransform, centerView }) => (
          <>
            <div className="zoom-controls">
              <button className="btn-icon" onClick={() => zoomIn()} title="Zoom In"><ZoomIn size={16} /></button>
              <button className="btn-icon" onClick={() => zoomOut()} title="Zoom Out"><ZoomOut size={16} /></button>
              <button className="btn-icon" onClick={() => centerView()} title="Center View"><Target size={16} /></button>
              <button className="btn-icon" onClick={() => resetTransform()} title="Reset 100%"><Maximize size={16} /></button>
            </div>
            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }} contentStyle={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
              <div ref={containerRef} style={{ padding: "2rem" }} />
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
    </div>
  );
});

MermaidPreview.displayName = "MermaidPreview";
export default MermaidPreview;
