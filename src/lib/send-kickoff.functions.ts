import { createServerFn } from "@tanstack/react-start";

export type SendKickoffInput = {
  to: string;
  subject: string;
  body: string;
};

export type SendKickoffResult = { id: string };

export const sendKickoffEmail = createServerFn({ method: "POST" })
  .inputValidator((data: SendKickoffInput) => data)
  .handler(async ({ data }): Promise<SendKickoffResult> => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured.");
    const from = "Handoff <agent@tryrelay.tech>";

    // Convert plain-text body to minimal HTML so links render as clickable.
    const html = data.body
      .split("\n")
      .map((line) => {
        const linked = line.replace(
          /(https?:\/\/[^\s<>"]+)/g,
          (url) => `<a href="${url}">${url}</a>`,
        );
        return linked;
      })
      .join("<br/>");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: data.to,
        subject: data.subject,
        text: data.body,
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = await res.json();
    return { id: json?.id ?? "" };
  });
