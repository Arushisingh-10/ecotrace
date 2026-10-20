import { ProtoNodeSchema, MAX_DEPTH, type ProtoNode } from "@/lib/prototype/schema";

export type Check = { name: string; passed: boolean; detail: string };

// Foreground/background pairs actually used by DynamicRenderer
const COLOR_PAIRS: { name: string; fg: string; bg: string }[] = [
  { name: "Heading on card", fg: "#0f172a", bg: "#ffffff" },
  { name: "Body text on card", fg: "#334155", bg: "#ffffff" },
  { name: "Primary button", fg: "#ffffff", bg: "#4338ca" },
  { name: "Secondary button", fg: "#0f172a", bg: "#e2e8f0" },
  { name: "Badge", fg: "#3730a3", bg: "#e0e7ff" },
  { name: "Input text", fg: "#0f172a", bg: "#ffffff" },
];

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(fg: string, bg: string): number {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function walk(node: ProtoNode, depth: number, visit: (n: ProtoNode, d: number) => void) {
  visit(node, depth);
  node.children?.forEach((c) => walk(c, depth + 1, visit));
}

export function verifyPrototype(tree: unknown): Check[] {
  const checks: Check[] = [];

  const parsed = ProtoNodeSchema.safeParse(tree);
  if (!parsed.success) {
    return [
      {
        name: "Schema validity",
        passed: false,
        detail: "Prototype does not match the allowed component schema.",
      },
    ];
  }
  const root = parsed.data;

  const all: { n: ProtoNode; d: number }[] = [];
  walk(root, 0, (n, d) => all.push({ n, d }));

  // 1. Accessibility labels
  const interactive = all.filter(({ n }) => n.type === "Button" || n.type === "Input" || n.type === "Select");
  const unlabeled = interactive.filter(({ n }) => {
    const p = n.props ?? {};
    return !(p.ariaLabel || p.label || p.text || p.placeholder);
  });
  checks.push({
    name: "Accessibility (ARIA labels)",
    passed: unlabeled.length === 0,
    detail:
      unlabeled.length === 0
        ? `All ${interactive.length} interactive elements have accessible labels.`
        : `${unlabeled.length} of ${interactive.length} interactive elements have no label.`,
  });

  // 2. Required structure
  const hasHeading = all.some(({ n }) => n.type === "Heading");
  const hasButton = all.some(({ n }) => n.type === "Button");
  const rootOk = root.type === "Card" || root.type === "Stack";
  const structureProblems = [
    !rootOk && "root must be a Card or Stack",
    !hasHeading && "missing a Heading",
    !hasButton && "missing a Button",
  ].filter(Boolean);
  checks.push({
    name: "Required structure",
    passed: structureProblems.length === 0,
    detail:
      structureProblems.length === 0
        ? "Root container, heading and call-to-action are present."
        : `Problems: ${structureProblems.join(", ")}.`,
  });

  // 3. Color contrast (WCAG AA 4.5:1)
  const failing = COLOR_PAIRS.filter((c) => contrastRatio(c.fg, c.bg) < 4.5);
  checks.push({
    name: "Color contrast (WCAG AA)",
    passed: failing.length === 0,
    detail:
      failing.length === 0
        ? `All ${COLOR_PAIRS.length} color pairs meet the 4.5:1 ratio.`
        : `Below 4.5:1: ${failing.map((f) => f.name).join(", ")}.`,
  });

  // 4. Safety limits
  const maxDepth = Math.max(...all.map((x) => x.d));
  checks.push({
    name: "Safety limits",
    passed: maxDepth <= MAX_DEPTH,
    detail: `Maximum nesting depth is ${maxDepth} (limit ${MAX_DEPTH}).`,
  });

  return checks;
}