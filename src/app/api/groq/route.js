import Groq from "groq-sdk";

const MODEL_CONFIG = {
  generate: { model: "openai/gpt-oss-120b", maxTokens: 4096, temperature: 0.1 },
  expand: { model: "openai/gpt-oss-120b", maxTokens: 4096, temperature: 0.1 },
  fix: { model: "openai/gpt-oss-20b", maxTokens: 2048, temperature: 0.05 },
  explain: { model: "openai/gpt-oss-20b", maxTokens: 2048, temperature: 0.5 },
  name: { model: "openai/gpt-oss-20b", maxTokens: 50, temperature: 0.1 },
  config: { model: "openai/gpt-oss-20b", maxTokens: 1024, temperature: 0.1 },
};

const DIAGRAM_KEYWORDS = [
  "flowchart", "graph", "sequenceDiagram", "classDiagram",
  "stateDiagram-v2", "stateDiagram", "erDiagram", "gantt",
  "pie", "gitGraph", "mindmap", "timeline", "journey",
  "quadrantChart", "sankey-beta", "xychart-beta", "block-beta",
];

const DIAGRAM_KEYWORD_RE = new RegExp(
  `^\\s*(${DIAGRAM_KEYWORDS.join("|")})\\b`, "m"
);

const MERMAID_RULES = `You generate Mermaid v11 diagrams. Respond ONLY with valid JSON: {"code":"<mermaid code>"}.

=== ABSOLUTE RULES ===
- Output RAW Mermaid code inside the "code" JSON key. No markdown fences. No explanations.
- Every label containing spaces, punctuation, or the word "end" MUST be wrapped in double quotes: A["My Label"]
- Node IDs must be alphanumeric or camelCase (no spaces, no hyphens): dbLayer, authSvc
- PREFER flowchart TD/LR for architecture, data-flow, and CRUD diagrams. Use classDiagram only when the user explicitly asks for classes/OOP.

=== FLOWCHART (safest, use by default) ===
flowchart TD
  subgraph SubName["Sub Label"]
    nodeA["Label A"] --> nodeB["Label B"]
  end
  nodeA -->|"relationship"| nodeC[("Database")]
- Shapes: [] square, () rounded, {} diamond, [()] cylinder, (()) circle, [("")]  stadium
- Arrows: -->, --->, -.->  ==>  -->|label|

=== CLASS DIAGRAM (only when explicitly requested) ===
classDiagram
  class UserService {
    String name
    getId()
    create(data) bool
  }
  UserService --> Database : uses
- Class names: single alphanumeric word, NO quoted labels like ["Label"]
- Members: NO visibility prefixes (+, -, #, ~). Just write the member name.
- Generics: use tilde not angle brackets: List~string~  not List<string>

=== SEQUENCE DIAGRAM ===
sequenceDiagram
  participant A as Alice
  participant B as Bob
  A->>B: Hello
  B-->>A: Response
  A->>+B: Activate
  B-->>-A: Deactivate
- Arrows: ->>, -->>  (solid/dotted async), ->, --> (solid/dotted sync)
- Always declare participants first

=== ER DIAGRAM ===
erDiagram
  USER ||--o{ ORDER : places
  ORDER ||--|{ LINE_ITEM : contains
  USER {
    int id PK
    string name
  }
- Entity names: UPPER_SNAKE_CASE, no spaces
- Relationships: ||--o{  ||--|{  }o--o{  }|--|{

=== STATE DIAGRAM ===
stateDiagram-v2
  [*] --> Idle
  Idle --> Processing : start
  Processing --> Done : complete

=== MINDMAP / PIE / GANTT ===
- mindmap: indent-based hierarchy, root at top
- pie title "Title" then "Label" : value
- gantt: dateFormat YYYY-MM-DD, section names, task : status, id, date, duration

=== THINGS THAT BREAK MERMAID v11 (NEVER DO THESE) ===
- class Foo["Quoted"] { }         → parser error
- + method() inside class block   → parser error
- Unquoted labels with ()[]{}     → parser error
- Node IDs with spaces/hyphens   → parser error
- Using "end" unquoted as a label → conflicts with block terminator
- HTML tags in labels              → XSS risk, may break parser
- Backticks inside labels          → conflicts with markdown mode
- graph (deprecated)               → use flowchart instead`;

const SYSTEM_PROMPTS = {
  code: `You are a Mermaid.js code generator. ${MERMAID_RULES}`,

  fix: `You are a Mermaid.js syntax debugger. You receive broken code and an error message.
${MERMAID_RULES}

ADDITIONAL FIX RULES:
- Analyze the error message to pinpoint the exact line/token causing the failure
- If classDiagram has quoted labels on class defs, remove them
- If class members have +/-/#/~ prefixes, remove them
- If labels contain unquoted special chars, add quotes
- If "end" is used as a label, wrap it in quotes
- If node IDs have spaces or hyphens, convert to camelCase
- Return the COMPLETE corrected diagram`,

  explain: `You are a diagram analyst. Respond ONLY with valid JSON: {"text":"<explanation>"}.
- Explain the diagram's entities, relationships, and flow step by step
- Be concise but thorough
- Do NOT include any Mermaid code`,

  name: `You are a naming assistant. Respond ONLY with valid JSON: {"text":"<filename>"}.
- Generate a concise, descriptive filename (2-4 words) for the diagram code provided
- Use PascalCase or kebab-case
- NO extension (do not include .mmd)
- If the diagram is empty or invalid, return "Untitled Diagram"`,

  config: `You are a Mermaid.js JSON Configuration generator. Respond ONLY with valid JSON: {"text":"<json string of config>"}.
- Generate a valid JSON configuration object for Mermaid.js based on the user's stylistic description.
- Use valid Mermaid config keys (e.g., theme, themeVariables, flowchart, etc.)
- DO NOT wrap the output in markdown fences. The text field should contain the raw JSON string.`,
};

function extractMermaidCode(raw) {
  const fenced = raw.match(/```(?:mermaid)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();

  const kwMatch = raw.match(DIAGRAM_KEYWORD_RE);
  if (kwMatch) return raw.slice(kwMatch.index).trim();

  return raw.replace(/^```.*$/gm, "").trim();
}

function sanitizeMermaid(code) {
  code = code.replace(/\uFEFF/g, "");
  code = code.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  code = code.replace(/\u201C|\u201D/g, '"').replace(/\u2018|\u2019/g, "'");
  code = code.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

  code = code.replace(/^```(?:mermaid)?\s*/gm, "").replace(/```\s*$/gm, "").trim();

  const kwMatch = code.match(DIAGRAM_KEYWORD_RE);
  if (kwMatch && kwMatch.index > 0) {
    code = code.slice(kwMatch.index);
  }

  if (/^\s*graph\s/m.test(code) && !/^\s*gitGraph/m.test(code)) {
    code = code.replace(/^\s*graph\s/, "flowchart ");
  }

  if (/classDiagram/.test(code)) {
    code = code.replace(/<(\w+)>/g, "~$1~");
  }

  code = code.replace(/<script[\s\S]*?<\/script>/gi, "");
  code = code.replace(/<(?!\w+>)[^>]+>/g, "");

  let lines = code.split("\n");
  let inClassBlock = false;
  let classIndent = 0;

  lines = lines.map((line) => {
    const classDefQuoted = line.match(/^(\s*class\s+\w+)\s*\["[^"]*"\]\s*(\{?\s*)$/);
    if (classDefQuoted) {
      line = classDefQuoted[1] + (classDefQuoted[2].includes("{") ? " {" : "");
    }

    if (/^\s*class\s+\w+\s*\{\s*$/.test(line)) {
      inClassBlock = true;
      classIndent = line.search(/\S/);
    }

    if (inClassBlock) {
      const trimmed = line.trim();
      if (trimmed === "}") {
        inClassBlock = false;
      } else if (trimmed !== "" && !trimmed.startsWith("class ")) {
        line = line.replace(/^(\s*)[+\-#~]\s*/, "$1");
      }
    }

    const flowNodeMatch = line.match(/^(\s*\w+)\[([^\]"]+)\]/);
    if (flowNodeMatch) {
      const label = flowNodeMatch[2];
      if (/[(){}|;,]/.test(label) || /\bend\b/i.test(label)) {
        line = line.replace(`[${label}]`, `["${label}"]`);
      }
    }

    return line;
  });

  code = lines.join("\n");
  code = code.replace(/\n{3,}/g, "\n\n");
  code = code.replace(/[ \t]+$/gm, "");

  return code.trim();
}

function buildUserPrompt(mode, prompt, codeToFix) {
  switch (mode) {
    case "explain":
      return `Explain this Mermaid diagram:\n${codeToFix || prompt}`;
    case "fix":
      return `Fix this Mermaid diagram.\n\nERROR:\n${prompt}\n\nBROKEN CODE:\n${codeToFix}`;
    case "expand":
      return `Expand this existing Mermaid diagram. Keep ALL existing nodes and add to them.\n\nEXISTING CODE:\n${codeToFix}\n\nDIRECTIVE: ${prompt}`;
    case "name":
      return `Suggest a concise filename for this Mermaid code:\n\n${prompt}`;
    case "config":
      return `Generate a Mermaid JSON config for this description: ${prompt}`;
    default:
      return prompt;
  }
}

export async function POST(request) {
  try {
    const { prompt, apiKey, mode = "generate", codeToFix } = await request.json();

    if (!apiKey) {
      return Response.json({ error: "Missing Groq API Key" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });
    const config = MODEL_CONFIG[mode] || MODEL_CONFIG.generate;
    const isTextResponse = mode === "explain" || mode === "name" || mode === "config";

    const systemPrompt = isTextResponse
      ? SYSTEM_PROMPTS[mode]
      : mode === "fix"
        ? SYSTEM_PROMPTS.fix
        : SYSTEM_PROMPTS.code;

    const userPrompt = buildUserPrompt(mode, prompt, codeToFix);

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          model: config.model,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          response_format: { type: "json_object" },
        });

        const raw = completion.choices[0]?.message?.content || "";
        const meta = { model: config.model, tokens: completion.usage };

        let parsed;
        try {
          parsed = JSON.parse(raw);
        } catch {
          if (isTextResponse) return Response.json({ text: raw, ...meta });
          const code = sanitizeMermaid(extractMermaidCode(raw));
          return Response.json({ code: code || raw, ...meta });
        }

        if (isTextResponse) {
          return Response.json({ text: parsed.text || raw, ...meta });
        }

        let code = parsed.code || "";
        if (!code) code = extractMermaidCode(raw);
        code = sanitizeMermaid(code);

        if (!code || !DIAGRAM_KEYWORD_RE.test(code)) {
          code = sanitizeMermaid(extractMermaidCode(raw));
        }

        return Response.json({ code, ...meta });
      } catch (err) {
        lastError = err;
        if (err.status === 429 && attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt + 1) * 1000));
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  } catch (error) {
    const status = error.status || 500;
    const message = error.status === 401
      ? "Invalid API key — check your Groq key and try again"
      : error.status === 429
        ? "Rate limit exceeded — please wait a moment and try again"
        : error.message;
    return Response.json({ error: message }, { status });
  }
}
