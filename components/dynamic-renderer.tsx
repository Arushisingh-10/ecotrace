import { ProtoNodeSchema, MAX_DEPTH, type ProtoNode } from "@/lib/prototype/schema";

function Fallback({ reason }: { reason: string }) {
  return (
    <div className="rounded-md border border-dashed border-red-500/50 p-2 text-xs text-red-400">
      Unsupported element: {reason}
    </div>
  );
}

function renderNode(node: ProtoNode, depth: number, key: string): React.ReactNode {
  if (depth > MAX_DEPTH) return <Fallback key={key} reason="maximum depth exceeded" />;

  const p = node.props ?? {};
  const kids = node.children?.map((c, i) => renderNode(c, depth + 1, `${key}-${i}`));

  switch (node.type) {
    case "Stack":
      return (
        <div
          key={key}
          className={`flex gap-3 ${
            p.direction === "row" ? "flex-col sm:flex-row" : "flex-col"
          }`}
        >
          {kids}
        </div>
      );

    case "Card":
      return (
        <div
          key={key}
          className="space-y-3 rounded-lg border border-slate-300 bg-white p-4 text-slate-900 shadow-sm"
        >
          {kids}
        </div>
      );

    case "Heading": {
      const cls =
        p.level === 1
          ? "text-2xl font-bold"
          : p.level === 3
          ? "text-base font-semibold"
          : "text-lg font-semibold";
      return (
        <h3 key={key} className={`${cls} text-slate-900`}>
          {p.text}
        </h3>
      );
    }

    case "Text":
      return (
        <p key={key} className="text-sm text-slate-700">
          {p.text}
        </p>
      );

    case "Badge":
      return (
        <span
          key={key}
          className="inline-block w-fit rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800"
        >
          {p.text}
        </span>
      );

    case "Button": {
      const cls =
        p.variant === "outline"
          ? "border border-slate-400 bg-white text-slate-900"
          : p.variant === "secondary"
          ? "bg-slate-200 text-slate-900"
          : "bg-indigo-700 text-white";
      return (
        <button
          key={key}
          type="button"
          aria-label={p.ariaLabel ?? p.text}
          className={`w-fit rounded-md px-4 py-2 text-sm font-medium ${cls}`}
        >
          {p.text}
        </button>
      );
    }

    case "Input": {
      const id = `proto-${key}`;
      return (
        <div key={key} className="space-y-1">
          {p.label && (
            <label htmlFor={id} className="text-sm font-medium text-slate-800">
              {p.label}
            </label>
          )}
          <input
            id={id}
            type="text"
            placeholder={p.placeholder}
            aria-label={p.ariaLabel ?? p.label ?? p.placeholder}
            className="w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
      );
    }

    case "Select": {
      const id = `proto-${key}`;
      return (
        <div key={key} className="space-y-1">
          {p.label && (
            <label htmlFor={id} className="text-sm font-medium text-slate-800">
              {p.label}
            </label>
          )}
          <select
            id={id}
            aria-label={p.ariaLabel ?? p.label}
            className="w-full rounded-md border border-slate-400 bg-white px-3 py-2 text-sm text-slate-900"
          >
            {(p.options ?? []).map((o, i) => (
              <option key={i}>{o}</option>
            ))}
          </select>
        </div>
      );
    }

    case "List":
      return (
        <ul key={key} className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {(p.items ?? []).map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );

    default:
      return <Fallback key={key} reason={String((node as { type: unknown }).type)} />;
  }
}

// Validates untrusted JSON first. Invalid payloads render a safe fallback, never throw.
export function DynamicRenderer({ data }: { data: unknown }) {
  const parsed = ProtoNodeSchema.safeParse(data);
  if (!parsed.success) {
    return <Fallback reason="invalid component schema" />;
  }
  return <>{renderNode(parsed.data, 0, "root")}</>;
}