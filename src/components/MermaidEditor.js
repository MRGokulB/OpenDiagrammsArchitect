"use client";

import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';

export default function MermaidEditor({ value, onChange }) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      extensions={[javascript()]}
      theme="dark"
      onChange={onChange}
      className="cm-editor"
      style={{ fontSize: 14 }}
    />
  );
}
