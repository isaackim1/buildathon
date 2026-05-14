import { createServerFn } from "@tanstack/react-start";

export type KickoffTask = {
  task_text: string;
  deadline: string;
  priority: string;
};

export type KickoffInput = {
  owner_name: string;
  owner_email: string;
  project_name: string;
  project_description: string;
  update_url: string;
  tasks: KickoffTask[];
};

export type KickoffDraft = { subject: string; body: string };

const SYSTEM_PROMPT = `You are Handoff's kickoff agent. You write short, friendly kickoff emails to a teammate listing the tasks they own from a meeting.

Tone: capable, friendly intern on the team. Warm, direct, no corporate fluff. Never sound like a system notification. No emoji.

Rules:
- Address the owner by FIRST NAME only.
- Briefly mention the project (1 line max).
- List each task as a short bullet with deadline and priority. No links per task.
- After the task list, include ONE single line with the update link in this exact format:
  Update your tasks → <UPDATE_URL>
  Replace <UPDATE_URL> with the URL provided. Plain URL, never wrapped in markdown.
- Close with one short, supportive line. Sign off as "— Handoff".

Return ONLY valid JSON in this exact shape:
{ "subject": "string", "body": "string" }
No prose, no markdown fences.`;

export const draftKickoffEmail = createServerFn({ method: "POST" })
  .inputValidator((data: KickoffInput) => data)
  .handler(async ({ data }): Promise<KickoffDraft> => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured on the server.");

    const taskBlock = data.tasks
      .map(
        (t, i) =>
          `${i + 1}. ${t.task_text}
   deadline: ${t.deadline || "not set"}
   priority: ${t.priority}`,
      )
      .join("\n\n");

    const userMessage = `OWNER: ${data.owner_name} <${data.owner_email}>
PROJECT: ${data.project_name}
PROJECT DESCRIPTION: ${data.project_description || "(none)"}
UPDATE_URL: ${data.update_url}

TASKS:
${taskBlock}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
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
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Claude returned no JSON.");
    let parsed: KickoffDraft;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error("Claude returned invalid JSON.");
    }
    return { subject: parsed.subject ?? "", body: parsed.body ?? "" };
  });
