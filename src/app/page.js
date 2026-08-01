"use client";
import React from "react";
import { EditorProvider } from "@/context/EditorContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import TopNavigation from "@/components/TopNavigation";
import TabBar from "@/components/TabBar";
import EditorPanel from "@/components/EditorPanel";
import ResizeHandle from "@/components/ResizeHandle";
import PreviewPanel from "@/components/PreviewPanel";
import ModalManager from "@/components/ModalManager";
import Toast from "@/components/Toast";

function AppContent() {
  // Initialize hooks that need context
  useKeyboardShortcuts();

  return (
    <>
      <TopNavigation />
      <div className="layout-container">
        <EditorPanel />
        <ResizeHandle />
        <PreviewPanel />
      </div>
      <ModalManager />
      <Toast />
    </>
  );
}

export default function Home() {
  return (
    <EditorProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </EditorProvider>
  );
}
