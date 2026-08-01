"use client";

import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { search } from "@codemirror/search";

export default function MermaidEditor({ value, onChange, editorTheme }) {
  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      <CodeMirror
        value={value}
        height="100%"
        extensions={[javascript(), search({ top: true })]}
        theme={editorTheme === "light" ? "light" : "dark"}
        onChange={onChange}
        style={{ height: "100%", fontSize: "14px" }}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          bracketMatching: true,
          foldGutter: true,
          autocompletion: false,
        }}
      />
    </div>
  );
}
