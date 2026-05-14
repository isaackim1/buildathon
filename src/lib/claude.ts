import { createServerFn } from "@tanstack/react-start";

export type ExtractedTask = {
  id: string;
  task_text: string;
  owner_name: string;
  owner_email: string;
  deadline: string; // ISO date YYYY-MM-DD
  priority: "HIGH" | "MEDIUM" | "LOW";
  state: "pending" | "in_progress" | "blocked" | "done";
  cluster: string;
  source_quote: string;
};

export type ExtractResult = {
  summary: string;
  tasks: ExtractedTask[];
};

const SYSTEM_PROMPT = `You are Handoff. Extract every concrete commitment from the meeting transcript.

For each commitment, produce:
- task_text: clear, action-oriented, second person where natural (max 140 chars)
- owner_name: must EXACTLY match a name from the provided attendee list
- owner_email: the email associated with that owner
- deadline: ISO date (YYYY-MM-DD), inferred from natural language anchored to TODAY
- priority: HIGH (explicit urgency / external deadline / blocker for others), MEDIUM (default), LOW (nice-to-have)
- cluster: short theme label, 1-3 words, Title Case (e.g. "Launch", "Pricing", "Compliance")
- source_quote: verbatim line from transcript, max 20 words

Also produce a 1-2 sentence "summary" of the meeting outcome.

Return ONLY valid JSON in this exact shape:
{
  "summary": "string",
  "tasks": [{ "task_text": "...", "owner_name": "...", "owner_email": "...", "deadline": "YYYY-MM-DD", "priority": "HIGH|MEDIUM|LOW", "cluster": "...", "source_quote": "..." }]
}
No prose, no markdown fences.`;

function uid() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  );
}

type ExtractInput = {
  transcript: string;
  attendees: { name: string; email: string }[];
};

export const extractTasks = createServerFn({ method: "POST" })
  .inputValidator((data: ExtractInput) => data)
  .handler(async ({ data }): Promise<ExtractResult> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured on the server.",
      );
    }

    const today = new Date().toISOString().slice(0, 10);
    const attendeeBlock = data.attendees
      .map((a) => `- ${a.name} <${a.email}>`)
      .join("\n");

    const userMessage = `TODAY: ${today}

ATTENDEES:
${attendeeBlock}

TRANSCRIPT:
"""
${data.transcript.trim()}
"""`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Claude API error ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = await res.json();
    const text: string = json?.content?.[0]?.text ?? "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Claude returned no JSON.");

    let parsed: { summary: string; tasks: Omit<ExtractedTask, "id" | "state">[] };
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      throw new Error("Claude returned invalid JSON.");
    }

    return {
      summary: parsed.summary ?? "",
      tasks: (parsed.tasks ?? []).map((t) => ({
        ...t,
        id: uid(),
        state: "pending" as const,
      })),
    };
  });
