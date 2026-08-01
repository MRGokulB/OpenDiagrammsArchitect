export const TEMPLATES = [
  { name: "Flowchart", desc: "Decision flow with branching paths", code: "flowchart TD\n  A[\"Start\"] --> B{\"Decision\"}\n  B -->|Yes| C[\"Process A\"]\n  B -->|No| D[\"Process B\"]\n  C --> E[\"End\"]\n  D --> E" },
  { name: "Sequence", desc: "Request-response communication", code: "sequenceDiagram\n  participant U as User\n  participant S as Server\n  participant DB as Database\n  U->>S: HTTP Request\n  S->>DB: Query Data\n  DB-->>S: Result Set\n  S-->>U: JSON Response" },
  { name: "Class Diagram", desc: "OOP inheritance hierarchy", code: "classDiagram\n  class Animal {\n    +String name\n    +int age\n    +makeSound()\n  }\n  class Dog {\n    +String breed\n    +bark()\n  }\n  class Cat {\n    +String color\n    +meow()\n  }\n  Animal <|-- Dog\n  Animal <|-- Cat" },
  { name: "ER Diagram", desc: "Entity relationships & schemas", code: "erDiagram\n  CUSTOMER ||--o{ ORDER : places\n  ORDER ||--|{ LINE_ITEM : contains\n  PRODUCT ||--o{ LINE_ITEM : \"ordered in\"\n  CUSTOMER {\n    string name\n    string email\n    int id\n  }\n  ORDER {\n    int id\n    date created\n    string status\n  }" },
  { name: "State Machine", desc: "Finite state transitions", code: "stateDiagram-v2\n  [*] --> Idle\n  Idle --> Processing : Submit\n  Processing --> Success : Complete\n  Processing --> Error : Fail\n  Error --> Idle : Reset\n  Success --> [*]" },
  { name: "Gantt Chart", desc: "Project timeline & scheduling", code: "gantt\n  title Project Timeline\n  dateFormat YYYY-MM-DD\n  section Planning\n    Research      :a1, 2024-01-01, 7d\n    Design        :a2, after a1, 5d\n  section Development\n    Frontend      :b1, after a2, 14d\n    Backend       :b2, after a2, 14d\n  section Testing\n    QA            :c1, after b1, 7d" },
  { name: "Mindmap", desc: "Hierarchical idea mapping", code: "mindmap\n  root((Project))\n    Frontend\n      React\n      CSS\n      TypeScript\n    Backend\n      Node.js\n      Database\n      API\n    DevOps\n      Docker\n      CI/CD\n      Monitoring" },
  { name: "Pie Chart", desc: "Proportional data distribution", code: "pie title Tech Stack Distribution\n  \"Frontend\" : 35\n  \"Backend\" : 30\n  \"Database\" : 15\n  \"DevOps\" : 10\n  \"Testing\" : 10" },
  { name: "Git Graph", desc: "Branch and merge visualization", code: "gitGraph\n  commit\n  branch develop\n  commit\n  commit\n  checkout main\n  commit\n  merge develop\n  commit" },
];

export const AI_PROMPTS = [
  { label: "Error handling", prompt: "Add comprehensive error handling paths and fallback flows to all critical nodes" },
  { label: "Database layer", prompt: "Add a database/storage layer with CRUD operations and data flow" },
  { label: "Auth flow", prompt: "Add user authentication and authorization flow with login, session, and token validation" },
  { label: "API gateway", prompt: "Add an API gateway pattern with request routing and load balancing" },
  { label: "Monitoring", prompt: "Add logging, monitoring, alerting, and observability components" },
  { label: "Microservices", prompt: "Convert to a microservices architecture with service mesh" },
  { label: "Caching layer", prompt: "Add a caching layer with Redis and cache invalidation strategy" },
  { label: "CI/CD pipeline", prompt: "Create a CI/CD pipeline with build, test, staging, and production stages" },
];

export const SHAPES = [
  { label: "Rectangle", snippet: "N[Rectangle]" },
  { label: "Rounded", snippet: "N(Rounded)" },
  { label: "Stadium", snippet: "N([Stadium])" },
  { label: "Database", snippet: "N[(Database)]" },
  { label: "Diamond", snippet: "N{Decision}" },
  { label: "Hexagon", snippet: "N{{Hexagon}}" },
  { label: "Subroutine", snippet: "N[[Subroutine]]" },
  { label: "Circle", snippet: "N((Circle))" },
  { label: "Asymmetric", snippet: "N>Asymmetric]" },
  { label: "Parallelogram", snippet: "N[/Parallel/]" },
  { label: "Alt Parallel", snippet: "N[\\Alt Parallel\\]" },
  { label: "Trapezoid", snippet: "N[/Trapezoid\\]" },
  { label: "Alt Trapezoid", snippet: "N[\\Alt Trap/]" },
  { label: "Double Circle", snippet: "N(((Double)))" },
];

export const FLOWS = [
  { label: "Solid →", snippet: "--> B[Node]" },
  { label: "Dotted →", snippet: "-.-> B[Node]" },
  { label: "Thick →", snippet: "==> B[Node]" },
  { label: "Open —", snippet: "--- B[Node]" },
  { label: "Dotted —", snippet: "-.- B[Node]" },
  { label: "Thick —", snippet: "=== B[Node]" },
  { label: "Bi-dir ↔", snippet: "<--> B[Node]" },
  { label: "Label →", snippet: "-- Label --> B[Node]" },
  { label: "Dotted Lbl", snippet: "-. Label .-> B[Node]" },
  { label: "Thick Lbl", snippet: "== Label ==> B[Node]" },
  { label: "Circle ●", snippet: "--o B[Node]" },
  { label: "Cross ×", snippet: "--x B[Node]" },
  { label: "Subgraph", snippet: "subgraph GroupName\n    Node1\n  end" },
];

export const PALETTES = [
  { color: "#0984e3", name: "blue" },
  { color: "#00b894", name: "green" },
  { color: "#e17055", name: "orange" },
  { color: "#9b59b6", name: "purple" },
  { color: "#f1c40f", name: "yellow" },
  { color: "#d63031", name: "red" },
  { color: "#636e72", name: "gray" },
  { color: "#00cec9", name: "teal" },
  { color: "#fd79a8", name: "pink" },
  { color: "#55efc4", name: "mint" },
  { color: "#74b9ff", name: "sky" },
  { color: "#fab1a0", name: "peach" },
];

export const SHORTCUTS = [
  { keys: "Ctrl + T", action: "New tab" },
  { keys: "Ctrl + W", action: "Close tab" },
  { keys: "Ctrl + Tab", action: "Next tab" },
  { keys: "Ctrl + S", action: "Save to workspace" },
  { keys: "Ctrl + Z", action: "Undo" },
  { keys: "Ctrl + Y", action: "Redo" },
  { keys: "F11", action: "True fullscreen" },
  { keys: "Ctrl + \\", action: "Toggle side panels" },
  { keys: "Ctrl + D", action: "Copy code to clipboard" },
  { keys: "?", action: "Keyboard shortcuts" },
  { keys: "Esc", action: "Close modals" },
];
