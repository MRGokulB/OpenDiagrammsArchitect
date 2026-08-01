# OpenDiagrammsArchitect 📐✨

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Mermaid](https://img.shields.io/badge/Mermaid.js-11.14.0-ff3670?style=for-the-badge)](https://mermaid.js.org/)
[![Groq AI](https://img.shields.io/badge/Groq_AI-Fast_Inference-f55036?style=for-the-badge)](https://groq.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

**OpenDiagrammsArchitect** is a modern, privacy-focused, AI-assisted Mermaid diagramming workspace and visual studio. It combines real-time live preview, multi-tab editing, high-resolution multi-format exports, and AI diagram copilot capabilities into a unified desktop-grade web application.

---

## 🌟 Key Features

### 🖥️ High-Performance Visual Editor & Preview
- **CodeMirror 6 Editor**: Syntax highlighting, search/replace, line numbers, and fast editing.
- **Sub-second Live Preview**: Real-time rendering with automatic debounce and syntax error boundaries.
- **Interactive Canvas**: Smooth infinite pan, zoom, pinch (`react-zoom-pan-pinch`), reset, and fit-to-screen controls.
- **Visual Snippet Palette**: One-click insertion of 14 node shapes, 12 connection styles, subgraphs, and color schemes.

### 📑 Multi-Tab Workspace & State Management
- **Concurrent Tabs**: Work on up to 20 diagrams simultaneously.
- **Per-Tab Undo / Redo**: 50-step deep history stack tracked per individual diagram.
- **Offline Persistence**: Automatic debounced `localStorage` saving so progress is never lost across sessions.
- **Filesystem Workspace**: Direct file management (`.mmd`) via secure local API with directory traversal guards.

### 🤖 Built-in Groq AI Copilot
- **4 AI Modes**:
  - `Generate`: Transform natural language architecture descriptions into structured Mermaid diagrams.
  - `Expand`: Add database layers, authentication flows, error handling, microservices, or caching to existing diagrams.
  - `Fix`: Automatically diagnose and fix Mermaid syntax errors with context-aware prompt rewriting.
  - `Explain`: Generate step-by-step architectural explanations and system flow breakdowns.
- **Client-Side API Key Control**: Your Groq API key is stored locally in your browser and never saved to external servers.

### 📤 Multi-Format High-DPI Export
- **PNG**: 2× high-DPI canvas rasterization with computed CSS styling and `<foreignObject>` HTML label conversion.
- **SVG**: Clean, standalone vector export with inlined styling.
- **PDF**: Vector-grade PDF generation powered by `jspdf`.
- **Raw Mermaid (`.mmd`)**: Direct download and one-click workspace filesystem saving.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: `20.x` or higher
- **npm** / **pnpm** / **yarn**

### Installation

1. Clone the repository:
```bash
git clone https://github.com/MRGokulB/OpenDiagrammsArchitect.git
cd OpenDiagrammsArchitect
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser at:
```text
http://localhost:3001
```

---

## 🐳 Docker Deployment

Run the entire application in an isolated Docker container with local volume mounting for diagrams:

```bash
docker compose up -d --build
```

The app will be accessible at `http://localhost:3001` (or your configured `APP_PORT`). All saved workspace files sync directly to your local `./workspace` directory.

To stop the container:
```bash
docker compose down
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Save diagram to workspace |
| <kbd>Ctrl</kbd> + <kbd>T</kbd> | Open new tab |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | Close active tab |
| <kbd>Ctrl</kbd> + <kbd>Tab</kbd> | Switch to next tab |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Copy diagram code to clipboard |
| <kbd>Ctrl</kbd> + <kbd>\</kbd> | Toggle side panels (focus preview) |
| <kbd>F11</kbd> | Toggle true fullscreen canvas |
| <kbd>?</kbd> | Open keyboard shortcuts modal |
| <kbd>Esc</kbd> | Close active modal |

---

## 📊 Supported Diagram Types

- **Flowcharts** (`flowchart TD / LR`)
- **Sequence Diagrams** (`sequenceDiagram`)
- **Class Diagrams** (`classDiagram`)
- **Entity Relationship Diagrams** (`erDiagram`)
- **State Diagrams** (`stateDiagram-v2`)
- **Gantt Charts** (`gantt`)
- **Mindmaps** (`mindmap`)
- **Pie Charts** (`pie title ...`)
- **Git Graphs** (`gitGraph`)

---

## 🏗️ Project Architecture

```text
├── public/                  # Static assets & icons
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── files/       # Workspace file CRUD API (GET, POST, PUT, PATCH, DELETE)
│   │   │   └── groq/        # Groq AI completion proxy with retry & rate limiting
│   │   ├── globals.css      # Design system, themes & animations
│   │   ├── layout.js        # Root application layout
│   │   └── page.js          # Core application shell & responsive grid layout
│   ├── components/
│   │   ├── AIPanel.js       # AI prompt interface, history & mode selection
│   │   ├── EditorPanel.js   # CodeMirror wrapper with Shape/Flow toolbar
│   │   ├── ExportMenu.js    # PNG, SVG, PDF, MMD export modal
│   │   ├── MermaidEditor.js # CodeMirror integration
│   │   ├── MermaidPreview.js# Live SVG rendering engine
│   │   ├── ModalManager.js  # Template gallery, shortcuts & workspace modal
│   │   ├── PreviewPanel.js  # Pan/zoom canvas & viewport tools
│   │   ├── TabBar.js        # Tab management bar with dirty state indicator
│   │   └── TopNavigation.js # Header bar with file actions & theme switcher
│   ├── constants/           # Diagram templates, presets, shortcuts & shapes
│   ├── context/
│   │   └── EditorContext.js # Centralized state reducer & localStorage sync
│   ├── hooks/               # Custom hooks (shortcuts, auto-save, fullscreen)
│   └── utils/
│       └── exportUtils.js   # SVG-to-Canvas, DOM style inlining & rasterization
├── workspace/               # Local diagram storage directory
├── Dockerfile               # Production container definition
├── docker-compose.yml       # Container orchestration & volume mapping
└── package.json             # Project dependencies & scripts
```

---

## ⚙️ Configuration & Environment

| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_PORT` | Port for Docker / production container | `3001` |
| `NODE_ENV` | Application environment mode | `production` / `development` |

> **Note:** The Groq API key is managed directly within the UI settings and stored in browser `localStorage`, eliminating the need for server-side secret management.

---

## 🛠️ Development & Contributing

### Available Scripts

- `npm run dev` — Launches development server on port 3001.
- `npm run build` — Compiles production Next.js build.
- `npm run start` — Runs the compiled production server.
- `npm run lint` — Runs ESLint checks.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
