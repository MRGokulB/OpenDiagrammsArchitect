# OpenDiagrammsArchitect

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg?style=flat-square)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-000000.svg?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-20232A.svg?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Mermaid](https://img.shields.io/badge/Mermaid-11.14.0-FF3670.svg?style=flat-square&logo=mermaid&logoColor=white)](https://mermaid.js.org/)
[![Groq SDK](https://img.shields.io/badge/Groq-API-F55036.svg?style=flat-square)](https://groq.com/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-2496ED.svg?style=flat-square&logo=docker&logoColor=white)](Dockerfile)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

An enterprise-grade, privacy-first diagramming workspace and visual architecture studio powered by Mermaid.js and Groq LLM inference. Designed for software architects, systems engineers, and technical leaders who require rapid, deterministic system modeling, real-time visual feedback, and zero data leakage.

---

## Architecture & Core Capabilities

### 1. High-Fidelity Rendering & Canvas Engine
* **CodeMirror 6 Editor**: Syntax highlighting, search/replace, line numbers, and fast editing.
* **Sub-Second Live Preview**: Automatic debouncing with isolated error boundaries prevents crashes on syntax errors.
* **Viewport Controls**: Infinite pan, zoom, pinch (`react-zoom-pan-pinch`), reset, and fit-to-screen controls.
* **Syntax Snippets**: Direct insertion of 14 standard node geometries, 12 connection styles, subgraphs, and color schemes.

### 2. Multi-Tab Workspace & State Engine
* **Concurrent Workspaces**: Manage up to 20 isolated diagram tabs in a single session.
* **Deep History Management**: Independent 50-step undo/redo stack maintained per active tab.
* **Zero-Loss Persistence**: Debounced `localStorage` synchronization preserves active states across browser refreshes.
* **Local Filesystem Integration**: Direct filesystem CRUD operations over the `workspace/` storage directory with path traversal security controls.

### 3. AI Architecture Copilot
* **Inference Modes**:
  * `Generate`: Transforms technical specifications and system prompts into structured Mermaid diagrams.
  * `Expand`: Augments existing architectures with database layers, auth flows, resilience patterns, or caching strategies.
  * `Fix`: Analyzes Mermaid compiler error traces and automatically resolves syntax errors in real time.
  * `Explain`: Generates step-by-step structural documentation and data flow breakdowns.
* **Client-Isolated Credentials**: Groq API keys remain strictly on the client side via browser storage and are never stored or logged on intermediary servers.

### 4. Deterministic Export Pipeline
* **PNG Export**: High-DPI (2x scale) rasterization via canvas with inlined computed styles and `<foreignObject>` conversion.
* **Vector SVG**: Clean, standalone SVG files with self-contained styling for technical documentation.
* **Vector PDF**: High-resolution PDF generation via `jspdf`.
* **Raw Mermaid Source**: Direct `.mmd` file export and one-click workspace synchronization.

---

## Supported Diagram Specifications

| Type | Mermaid Directive | Use Case |
| :--- | :--- | :--- |
| **Flowchart** | `flowchart TD` / `LR` | System workflows, logic branches, and stateful decisions |
| **Sequence Diagram** | `sequenceDiagram` | Synchronous / asynchronous API and service communications |
| **Class Diagram** | `classDiagram` | Domain models, inheritance structures, and interface definitions |
| **Entity Relationship** | `erDiagram` | Relational schemas, cardinalities, and database entities |
| **State Machine** | `stateDiagram-v2` | Finite state transitions and lifecycle monitoring |
| **Gantt Chart** | `gantt` | Project timelines, milestones, and resource scheduling |
| **Mindmap** | `mindmap` | Hierarchical architecture mapping and domain breakdown |
| **Git Graph** | `gitGraph` | Branching strategies, release lifecycles, and merge flows |
| **Pie Chart** | `pie` | Resource utilization and architectural component breakdown |

---

## Getting Started

### Prerequisites
* **Node.js**: `v20.0.0` or higher
* **npm** / **yarn** / **pnpm**

### Local Installation

```bash
# Clone the repository
git clone https://github.com/MRGokulB/OpenDiagrammsArchitect.git
cd OpenDiagrammsArchitect

# Install dependencies
npm install

# Start the development server (runs on port 3001)
npm run dev
```

Navigate to `http://localhost:3001` in your browser.

---

## Docker Deployment

The application is containerized using Alpine Node.js with automated host volume mapping for diagrams:

```bash
# Build and start container in detached mode
docker compose up -d --build

# View container logs
docker compose logs -f

# Stop and remove containers
docker compose down
```

All diagrams created and saved via the workspace API are mapped directly to the local `./workspace` folder on your host machine.

---

## Keyboard Shortcuts

| Shortcut | Function |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>S</kbd> | Save diagram to workspace |
| <kbd>Ctrl</kbd> + <kbd>T</kbd> | Create new workspace tab |
| <kbd>Ctrl</kbd> + <kbd>W</kbd> | Close active workspace tab |
| <kbd>Ctrl</kbd> + <kbd>Tab</kbd> | Cycle to next tab |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo last change |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo change |
| <kbd>Ctrl</kbd> + <kbd>D</kbd> | Copy diagram code to clipboard |
| <kbd>Ctrl</kbd> + <kbd>\</kbd> | Toggle editor / preview focus view |
| <kbd>F11</kbd> | Fullscreen canvas mode |
| <kbd>?</kbd> | Display keyboard shortcuts modal |
| <kbd>Esc</kbd> | Dismiss active modal or overlay |

---

## Project Structure

```text
OpenDiagrammsArchitect/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── files/          # Workspace filesystem CRUD endpoints
│   │   │   └── groq/           # Groq AI completion proxy with retry logic
│   │   ├── globals.css         # Design system, layout tokens, and themes
│   │   ├── layout.js           # Next.js App Router root layout
│   │   └── page.js             # Core editor and preview viewport layout
│   ├── components/
│   │   ├── AIPanel.js          # AI prompt control, modes, and history
│   │   ├── EditorPanel.js      # CodeMirror wrapper and toolbars
│   │   ├── ExportMenu.js       # Multi-format export dialog (PNG, SVG, PDF, MMD)
│   │   ├── MermaidEditor.js    # CodeMirror 6 engine integration
│   │   ├── MermaidPreview.js   # Dynamic SVG rendering engine
│   │   ├── ModalManager.js     # Template library and shortcut dialogs
│   │   ├── PreviewPanel.js     # Pan/zoom canvas and display controls
│   │   ├── TabBar.js           # Tab management and dirty state tracking
│   │   └── TopNavigation.js    # Header controls, presets, and actions
│   ├── constants/              # Diagram templates, presets, and shortcuts
│   ├── context/
│   │   └── EditorContext.js    # Centralized state reducer & localStorage sync
│   ├── hooks/                  # Custom lifecycle and shortcut hooks
│   └── utils/
│       └── exportUtils.js      # Style computation, SVG-to-Canvas, and export handlers
├── workspace/                  # Local and container volume-mounted diagram storage
├── Dockerfile                  # Production container definition
├── docker-compose.yml          # Container service definition
└── package.json                # Dependencies and project scripts
```

---

## Configuration & Environment

| Variable | Description | Default |
| :--- | :--- | :--- |
| `APP_PORT` | Port exposed by Docker / production server | `3001` |
| `NODE_ENV` | Application environment (`production` / `development`) | `production` |

---

## License

This project is open source and available under the [MIT License](LICENSE).
