import { createServerFn } from "@tanstack/react-start";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export type ReplyChatInput = {
  owner_name: string;
  task_text: string;
  deadline: string;
  priority: string;
  project_name: string;
  project_description: string;
  history: ChatTurn[];
};

const SYSTEM = (i: ReplyChatInput) => `You are Handoff, a friendly agent helping ${i.owner_name} with their task: ${i.task_text}
Deadline: ${i.deadline || "not set"}, Priority: ${i.priority}
Project: ${i.project_name} — ${i.project_description || "(no description)"}

Your goal: understand their current status, identify any blockers, find out what help they need.
Ask focused questions, max 3 turns.
When you have enough information, say something like: "Thanks ${i.owner_name.split(" ")[0]}, I have everything I need. I'll flag this to the right people. Feel free to add anything else, or close this when you're ready."
Always be warm, never robotic, never sound like a system notification.
Return only the message text, no JSON, no markdown.`;

async function callClaude(system: string, messages: ChatTurn[], maxTokens = 1024): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Claude API error ${res.status}: ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  return (json?.content?.[0]?.text ?? "").trim();
}

export const replyChat = createServerFn({ method: "POST" })
  .inputValidator((d: ReplyChatInput) => d)
  .handler(async ({ data }): Promise<{ reply: string }> => {
    const reply = await callClaude(SYSTEM(data), data.history);
    return { reply };
  });

export type BlockerSummary = {
  status: string;
  blocker_description: string;
  needs_from: string;
  recommended_action: string;
};

export const summarizeReplyChat = createServerFn({ method: "POST" })
  .inputValidator((d: ReplyChatInput) => d)
  .handler(async ({ data }): Promise<BlockerSummary> => {
    const sys = `You are Handoff. Summarize the conversation between the agent and ${data.owner_name} about the task: "${data.task_text}".
Return ONLY valid JSON in this exact shape:
{ "status": "string", "blocker_description": "string", "needs_from": "string", "recommended_action": "string" }
- status: short label like "blocked", "in_progress", "needs_help", "done"
- blocker_description: 1-2 sentence summary of what is blocking them or their current status
- needs_from: who or what they need (name, role, or resource)
- recommended_action: 1 sentence next step for the team
No prose, no markdown fences.`;
    const text = await callClaude(sys, data.history, 800);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude returned no JSON for summary.");
    try {
      const parsed = JSON.parse(match[0]);
      return {
        status: parsed.status ?? "blocked",
        blocker_description: parsed.blocker_description ?? "",
        needs_from: parsed.needs_from ?? "",
        recommended_action: parsed.recommended_action ?? "",
      };
    } catch {
      throw new Error("Claude returned invalid JSON for summary.");
    }
  });
