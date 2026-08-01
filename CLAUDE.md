# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

> The `@AGENTS.md` import above is load-bearing: this project pins **Next.js 16.2.4 / React 19.2.4**, whose APIs and conventions diverge from older training data. Before writing routing, server, or build code, read the relevant guide under `node_modules/next/dist/docs/`.

## Commands

- `npm run dev` — dev server on **port 3001** (not 3000)
- `npm run build` — production build
- `npm run start` — production server on port 3001
- `npm run lint` — ESLint (flat config in `eslint.config.mjs`, extends `next/core-web-vitals`)

No test framework is configured. Docker (`Dockerfile`) builds the same app but `EXPOSE`s 3000 while the server actually listens on 3001 — a known mismatch when containerizing.

Import alias: `@/*` → `src/*` (see `jsconfig.json`).

## Architecture

A single-page Mermaid diagram editor. Everything renders inside one client-side route (`src/app/page.js`); there are no other pages. Two API routes provide the only server-side logic.

### State: one reducer, tab-centric

`src/context/EditorContext.js` is the heart of the app — a single `useReducer` store wrapping the entire UI via `EditorProvider`. All components consume it through the `useEditor()` hook and mutate via `dispatch({ type, payload })`. Key conventions:

- **Tabs are the unit of work.** Each tab carries its own `code`, `configStr`/`parsedConfig`, `historyStack`/`historyIndex` (per-tab undo/redo, capped at `MAX_HISTORY = 50`), `svgContent`, and `renderError`. `MAX_TABS = 20`.
- **`UPDATE_TAB_CODE` is the only action that pushes to history.** Use the `updateCode()` helper for user edits; use `updateActiveTab()` (which dispatches `UPDATE_ACTIVE_TAB`) for non-history metadata changes (config, svg, dirty flag) so you don't pollute undo history.
- **Persistence is localStorage, debounced.** Tabs are saved to `diagram_tabs` (1s debounce); `svgContent` and `parsedConfig` are stripped before saving to keep it small. Theme, active tab id, editor width ratio, and the Groq API key also live in localStorage. Client-only state is gated behind `state.isClient` (set by `INIT_CLIENT`) to avoid SSR hydration mismatches — components return `null` until then.

### Rendering pipeline

`MermaidPreview.js` (in `PreviewPanel`) owns Mermaid rendering: it debounces 500ms, prepends a `%%{init: ...}%%` directive built from the tab's `parsedConfig`, calls `mermaid.render()`, and reports back via `onSvgRendered`/`onError` callbacks that write `svgContent`/`renderError` into the active tab. It exposes `getSvgContent()` through a `forwardRef` imperative handle — this is how export and "copy PNG" reach the live SVG.

### Export

`src/utils/exportUtils.js` → `renderSvgToPngBase64()` is the tricky part: it clones the live SVG, converts every `<foreignObject>` (HTML labels Mermaid emits) into native SVG `<text>`/`<tspan>` by reading computed styles off the live DOM, inlines matching CSS rules, then rasterizes via a canvas at 2× scale. This DOM-dependent approach means **export only works in the browser against an already-rendered diagram**. `ExportMenu.js` wraps it for PDF (jsPDF), PNG, SVG, and `.mmd`, offering both "save to workspace" (POST to `/api/files`) and "export to device" (File System Access API with `<a download>` fallback).

### API routes

- `src/app/api/groq/route.js` — proxies Groq chat completions. `MODEL_CONFIG` maps four modes (`generate`, `expand`, `fix`, `explain`) to model/temperature/token settings. Strips markdown fences from output for code modes, retries on HTTP 429 with exponential backoff. The API key is sent per-request from the client (stored in localStorage), not a server env var.
- `src/app/api/files/route.js` — CRUD over a `workspace/` directory on the server filesystem (GET list, POST write, PUT read content, PATCH rename, DELETE). All paths go through `resolveWorkspaceFile()` which guards against directory traversal. Saved diagrams default to `.mmd`.

### AI flow

`AIPanel.js` orchestrates AI actions client-side: it rate-limits to one request per 3s, caches responses in localStorage by a hash of mode+prompt, and rewrites prompts per mode before POSTing to `/api/groq` (e.g. `expand` embeds the current code, `fix` sends `renderError` + code). Results flow back into the store as either new tab code or an `aiResponse` analysis string.

### Component layout

`page.js` composes `TopNavigation` → `TabBar` → (`EditorPanel` | `ResizeHandle` | `PreviewPanel`) → `ModalManager` → `Toast`, all inside `EditorProvider` + `ErrorBoundary`. `EditorPanel` has three sub-tabs (Code / Config / AI) and uses CodeMirror (`MermaidEditor.js`) with the JavaScript language mode as a stand-in for Mermaid syntax. `ResizeHandle` drives `editorWidthRatio` (0 = preview only, 100 = editor only). Keyboard shortcuts are centralized in `useKeyboardShortcuts.js`; the canonical list lives in `SHORTCUTS` in `src/constants/index.js` alongside the diagram `TEMPLATES`, toolbar `SHAPES`/`FLOWS`/`PALETTES`, and `AI_PROMPTS`.

> Note: `src/components/MermaidEditor.js` is the legacy component name but now only wraps CodeMirror; the app shell lives in the `*Panel` components, not here.
