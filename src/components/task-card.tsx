import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, User2, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExtractedTask } from "@/lib/claude";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const PRIORITY_STYLES: Record<ExtractedTask["priority"], string> = {
  HIGH: "border-destructive/40 bg-destructive/10 text-destructive",
  MEDIUM: "border-warn/40 bg-warn/10 text-warn",
  LOW: "border-border bg-muted text-muted-foreground",
};

const STATE_STYLES: Record<ExtractedTask["state"], string> = {
  pending: "border-border bg-muted/40 text-muted-foreground",
  in_progress: "border-info/40 bg-info/10 text-info",
  blocked: "border-destructive/40 bg-destructive/10 text-destructive",
  done: "border-primary/40 bg-primary/15 text-primary",
};

const STATE_LABEL: Record<ExtractedTask["state"], string> = {
  pending: "pending",
  in_progress: "in progress",
  blocked: "blocked",
  done: "done",
};

export function TaskCard({
  task,
  attendees,
  onChange,
}: {
  task: ExtractedTask;
  attendees: { name: string; email: string }[];
  onChange: (next: ExtractedTask) => void;
}) {
  const deadlineDate = React.useMemo(() => {
    const d = new Date(task.deadline + "T00:00:00");
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [task.deadline]);

  const ownerOptions = React.useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    for (const a of attendees) map.set(a.email, a);
    if (task.owner_email && !map.has(task.owner_email)) {
      map.set(task.owner_email, { name: task.owner_name, email: task.owner_email });
    }
    return Array.from(map.values());
  }, [attendees, task.owner_email, task.owner_name]);

  return (
    <div className="group rounded-md border border-border bg-card p-4 transition-colors hover:border-border/80">
      <div className="flex flex-wrap items-start gap-2">
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
            PRIORITY_STYLES[task.priority],
          )}
        >
          {task.priority}
        </span>
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
            STATE_STYLES[task.state],
          )}
        >
          {STATE_LABEL[task.state]}
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {task.cluster}
        </span>
      </div>

      <div className="mt-3 grid gap-4 md:grid-cols-[1fr_280px]">
        <div className="space-y-3">
          <Input
            value={task.task_text}
            onChange={(e) => onChange({ ...task, task_text: e.target.value })}
            className="h-auto border-0 bg-transparent px-0 text-base font-medium leading-snug text-foreground shadow-none focus-visible:ring-0"
          />

          <div className="flex items-start gap-2 border-l-2 border-primary/60 pl-3">
            <Quote className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
            <p className="font-mono text-xs italic leading-relaxed text-muted-foreground">
              {task.source_quote}
            </p>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-border bg-background/40 p-3">
          <FieldLabel>Owner</FieldLabel>
          <Select
            value={task.owner_email}
            onValueChange={(email) => {
              const found = ownerOptions.find((o) => o.email === email);
              if (found)
                onChange({ ...task, owner_email: found.email, owner_name: found.name });
            }}
          >
            <SelectTrigger className="h-8 font-mono text-xs">
              <User2 className="mr-1.5 size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ownerOptions.map((o) => (
                <SelectItem key={o.email} value={o.email} className="font-mono text-xs">
                  {o.name}{" "}
                  <span className="text-muted-foreground">&lt;{o.email}&gt;</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <FieldLabel>Deadline</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="h-8 w-full justify-start font-mono text-xs font-normal"
              >
                <CalendarIcon className="mr-1.5 size-3.5 text-muted-foreground" />
                {deadlineDate ? format(deadlineDate, "EEE, d MMM yyyy") : "Pick date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={deadlineDate}
                onSelect={(d) => {
                  if (d)
                    onChange({ ...task, deadline: d.toISOString().slice(0, 10) });
                }}
                initialFocus
                className="pointer-events-auto p-3"
              />
            </PopoverContent>
          </Popover>

          <FieldLabel>Priority</FieldLabel>
          <Select
            value={task.priority}
            onValueChange={(v) =>
              onChange({ ...task, priority: v as ExtractedTask["priority"] })
            }
          >
            <SelectTrigger className="h-8 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="HIGH" className="font-mono text-xs">
                HIGH
              </SelectItem>
              <SelectItem value="MEDIUM" className="font-mono text-xs">
                MEDIUM
              </SelectItem>
              <SelectItem value="LOW" className="font-mono text-xs">
                LOW
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}
