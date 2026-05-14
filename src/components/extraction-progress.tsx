import * as React from "react";

const STAGES = [
  "Parsing transcript...",
  "Identifying speakers...",
  "Extracting commitments...",
  "Inferring deadlines...",
];

export function ExtractionProgress() {
  const [stage, setStage] = React.useState(0);
  const [pct, setPct] = React.useState(4);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPct((p) => {
        const next = p + Math.random() * 6 + 2;
        return Math.min(next, 95);
      });
      setStage((s) => (s < STAGES.length - 1 && Math.random() > 0.65 ? s + 1 : s));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-md border border-border bg-card p-5">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="flex items-center gap-2 text-foreground">
          <span className="inline-block size-1.5 animate-pulse rounded-full bg-primary" />
          {STAGES[stage]}
        </span>
        <span className="text-muted-foreground">{Math.floor(pct)}%</span>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-primary transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <ol className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {STAGES.map((s, i) => (
          <li
            key={s}
            className={`font-mono text-[10px] uppercase tracking-wider ${
              i <= stage ? "text-foreground" : "text-muted-foreground/50"
            }`}
          >
            <span className="mr-1">0{i + 1}</span>
            {s.replace("...", "")}
          </li>
        ))}
      </ol>
    </div>
  );
}
