"use client";
import React, { useRef, useEffect } from "react";
import { useEditor } from "@/context/EditorContext";

export default function ResizeHandle() {
  const { state, dispatch } = useEditor();
  const handleRef = useRef(null);
  const isDragging = useRef(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging.current) return;
      
      const container = handleRef.current?.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      let newRatio = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      // Constraints (min 20%, max 80%)
      if (newRatio < 20) newRatio = 20;
      if (newRatio > 80) newRatio = 80;

      dispatch({ type: "SET_UI_STATE", payload: { editorWidthRatio: newRatio } });
      localStorage.setItem("editor_width_ratio", newRatio);
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.classList.remove("resizing");
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dispatch]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = "col-resize";
    document.body.classList.add("resizing");
  };

  const handleDoubleClick = () => {
    dispatch({ type: "SET_UI_STATE", payload: { editorWidthRatio: 40 } });
    localStorage.setItem("editor_width_ratio", 40);
  };

  // Hide handle if either panel is fully collapsed
  if (state.editorWidthRatio === 0 || state.editorWidthRatio === 100) {
    return null;
  }

  return (
    <div 
      ref={handleRef}
      className="resize-handle"
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      title="Drag to resize, double-click to reset"
    >
      <div className="resize-handle-grip" />
    </div>
  );
}
