import { Check } from "lucide-react";

const STEPS = [
  { title: "Feedback", sub: "User input received" },
  { title: "AI Analysis", sub: "Problem & evidence extracted" },
  { title: "Alternatives", sub: "3 solutions generated" },
  { title: "Decision", sub: "Human reviewed" },
  { title: "Prototype", sub: "UI generated" },
  { title: "Verification", sub: "Tests run" },
];

export function StepsList({ done }: { done: boolean[] }) {
  const currentIndex = done.findIndex((d) => !d);

  return (
    <ol className="space-y-3">
      {STEPS.map((s, i) => {
        const isDone = done[i];
        const isCurrent = i === currentIndex;
        return (
          <li
            key={s.title}
            className={`flex items-center gap-3 rounded-lg p-2 ${
              isCurrent ? "bg-violet-600/20 ring-1 ring-violet-500/50" : ""
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                isDone
                  ? "bg-emerald-500 text-white"
                  : isCurrent
                  ? "bg-violet-600 text-white"
                  : "bg-white/10 text-slate-400"
              }`}
            >
              {isDone ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{s.title}</p>
              <p className="truncate text-xs text-slate-400">{s.sub}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - completed / total);

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-20 w-20 shrink-0">
        <svg viewBox="0 0 80 80" className="h-20 w-20 -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">
          {completed}/{total}
        </span>
      </div>
      <div>
        <p className="text-sm font-semibold text-white">Steps Completed</p>
        <p className="text-xs text-slate-400">From feedback to verification</p>
      </div>
    </div>
  );
}