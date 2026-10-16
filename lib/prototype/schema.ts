import { z } from "zod";

// Only these component types are allowed. Anything else is rejected.
export const ALLOWED_TYPES = [
  "Stack",
  "Card",
  "Heading",
  "Text",
  "Button",
  "Input",
  "Select",
  "List",
  "Badge",
] as const;

export type ComponentType = (typeof ALLOWED_TYPES)[number];

// Props are plain strings/numbers/booleans only. No functions, no HTML.
const SafeString = z.string().max(300);

export type ProtoNode = {
  type: ComponentType;
  props?: {
    text?: string;
    label?: string;
    placeholder?: string;
    ariaLabel?: string;
    variant?: "primary" | "secondary" | "outline";
    level?: 1 | 2 | 3;
    direction?: "row" | "column";
    options?: string[];
    items?: string[];
  };
  children?: ProtoNode[];
};

const PropsSchema = z
  .object({
    text: SafeString.optional(),
    label: SafeString.optional(),
    placeholder: SafeString.optional(),
    ariaLabel: SafeString.optional(),
    variant: z.enum(["primary", "secondary", "outline"]).optional(),
    level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    direction: z.enum(["row", "column"]).optional(),
    options: z.array(SafeString).max(10).optional(),
    items: z.array(SafeString).max(12).optional(),
  })
  .strict();

export const ProtoNodeSchema: z.ZodType<ProtoNode> = z.lazy(() =>
  z.object({
    type: z.enum(ALLOWED_TYPES),
    props: PropsSchema.optional(),
    children: z.array(ProtoNodeSchema).max(20).optional(),
  })
);

export const MAX_DEPTH = 6;