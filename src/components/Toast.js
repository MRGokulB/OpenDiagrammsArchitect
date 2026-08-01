"use client";
import React from "react";
import { useEditor } from "@/context/EditorContext";

export default function Toast() {
  const { state } = useEditor();
  const { toast } = state;

  if (!state.isClient) return null;

  return (
    <div className={`toast ${toast.type === "error" ? "error" : ""} ${toast.show ? "show" : ""}`}>
      {toast.message}
    </div>
  );
}
