import * as React from "react";
import { X, AtSign } from "lucide-react";
import { cn } from "@/lib/utils";

export type Attendee = { name: string; email: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AttendeeInput({
  value,
  onChange,
}: {
  value: Attendee[];
  onChange: (next: Attendee[]) => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const tryAdd = () => {
    const raw = draft.trim();
    if (!raw) return;
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length < 2) {
      setError("Format: Name, email@domain.com");
      return;
    }
    const email = parts[parts.length - 1];
    const name = parts.slice(0, -1).join(", ");
    if (!EMAIL_RE.test(email)) {
      setError("That email looks off.");
      return;
    }
    if (value.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
      setError("Already added.");
      return;
    }
    onChange([...value, { name, email }]);
    setDraft("");
    setError(null);
  };

  const remove = (email: string) =>
    onChange(value.filter((a) => a.email !== email));

  return (
    <div>
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background/40 px-2 py-2 transition-colors focus-within:border-ring",
          error && "border-destructive/60",
        )}
      >
        {value.map((a) => (
          <span
            key={a.email}
            className="group inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted px-2 py-1 font-mono text-xs"
          >
            <span className="text-foreground">{a.name}</span>
            <span className="text-muted-foreground">{a.email}</span>
            <button
              type="button"
              onClick={() => remove(a.email)}
              className="text-muted-foreground transition-colors hover:text-destructive"
              aria-label={`Remove ${a.name}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <div className="flex min-w-[200px] flex-1 items-center gap-1">
          <AtSign className="size-3.5 text-muted-foreground" />
          <input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                tryAdd();
              } else if (e.key === "Backspace" && !draft && value.length) {
                onChange(value.slice(0, -1));
              }
            }}
            onBlur={tryAdd}
            placeholder={value.length ? "" : "Maya van Dijk, maya@northbeam.nl"}
            className="flex-1 bg-transparent py-1 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>
      <p
        className={cn(
          "mt-1.5 font-mono text-[10px] uppercase tracking-wider",
          error ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {error ?? "Name, email → Enter. Email used for agent follow-ups."}
      </p>
    </div>
  );
}
