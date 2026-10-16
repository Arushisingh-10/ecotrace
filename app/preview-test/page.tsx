import { DynamicRenderer } from "@/components/dynamic-renderer";

const good = {
  type: "Card",
  children: [
    { type: "Badge", props: { text: "Recommended" } },
    { type: "Heading", props: { text: "Find the right plan", level: 2 } },
    { type: "Text", props: { text: "Answer two quick questions." } },
    { type: "Input", props: { label: "Team size", placeholder: "e.g. 5" } },
    {
      type: "Select",
      props: { label: "Main need", options: ["Collaboration", "Reporting", "Security"] },
    },
    { type: "List", props: { items: ["Pro: up to 10 users", "Business: unlimited"] } },
    { type: "Button", props: { text: "Get recommendation", ariaLabel: "Get plan recommendation" } },
  ],
};

// Malicious payloads: must all fall back safely
const evil1 = { type: "Script", props: { text: "alert(1)" } };
const evil2 = {
  type: "Button",
  props: { text: "Click", onClick: "alert(1)" },
};
const evil3 = {
  type: "Text",
  props: { dangerouslySetInnerHTML: { __html: "<img src=x onerror=alert(1)>" } },
};
const evil4 = { type: "Text", props: { text: "<img src=x onerror=alert(1)>" } };

export default function PreviewTest() {
  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6 text-slate-100">
      <section>
        <h2 className="mb-2 font-semibold">Valid prototype</h2>
        <DynamicRenderer data={good} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Malicious payloads (should all be safe)</h2>
        <DynamicRenderer data={evil1} />
        <DynamicRenderer data={evil2} />
        <DynamicRenderer data={evil3} />
        <div>
          <p className="mb-1 text-xs text-slate-400">
            Text with HTML: shown as plain text, not executed
          </p>
          <DynamicRenderer data={evil4} />
        </div>
      </section>
    </main>
  );
}