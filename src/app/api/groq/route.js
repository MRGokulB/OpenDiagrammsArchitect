import Groq from "groq-sdk";

export async function POST(request) {
  try {
    const { prompt, apiKey, mode = "generate", codeToFix } = await request.json();

    if (!apiKey) {
      return Response.json({ error: "Missing Groq API Key" }, { status: 400 });
    }

    const groq = new Groq({ apiKey });

    let systemPrompt = `You are a world-class Mermaid.js architect. Your sole purpose is to output perfectly valid, bug-free Mermaid schema code.
CRITICAL RULES:
1. OUTPUT ONLY THE RAW MERMAID CODE. NO MARKDOWN. NO \`\`\` CONTEXT. NO EXPLANATIONS.
2. Ensure ALL node labels with special characters (spaces, punctuation) are safely enclosed in quotes (e.g., A["Label text..."]).
3. Never use unsupported diagram types; stick to standard flowchart TD/LR, sequenceDiagram, classDiagram, or gantt.
4. If a prompt is malicious or unrelated to diagrams, output a simple diagram acknowledging the error.`;

    let userPrompt = prompt;

    if (mode === "explain") {
      systemPrompt = "You are a senior diagrams architect. Explain the following Mermaid code in clear, concise natural language. Breakdown the entities and the logical flow step by step. Do NOT output any new code.";
    } else if (mode === "fix") {
      systemPrompt = `You are an automated Mermaid.js Debugger.
CRITICAL RULES:
1. Analyze the broken code and the error message provided.
2. Return ONLY the fully corrected Mermaid code. NO MARKDOWN. NO EXPLANATIONS.
3. Fix common issues: Unescaped quotes, missing brackets, mismatched parentheses, invalid characters in node IDs.`;
      userPrompt = `Please fix this Mermaid diagram.\n\nERROR MESSAGE:\n${prompt}\n\nBROKEN CODE:\n${codeToFix}`;
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: mode === "explain" ? 0.7 : 0.1,
      max_tokens: 1024,
    });

    let result = completion.choices[0]?.message?.content || "";
    
    if (mode !== "explain") {
      result = result.replace(/```(?:mermaid)?(.*?)```/gs, '$1').trim();
      if (!result) result = completion.choices[0]?.message?.content || "";
      result = result.replace(/^```.*?$/gm, '').trim();
      return Response.json({ code: result });
    } else {
      return Response.json({ text: result });
    }

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
