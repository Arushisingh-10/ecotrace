# EchoTrace: The Human Intent Graph System

EchoTrace turns raw customer feedback into traceable, evidence-backed product
improvements. AI acts as an analyst that proposes bounded alternatives. Humans
make every decision, and every step stays linked back to the original feedback.

**Live demo:** https://ecotracee2.vercel.app

## Features

- Feedback ingestion (text and PNG/JPEG screenshots, max 5 MB)
- AI evidence extraction (problem, evidence, unsupported assumptions)
- Three structurally different solution alternatives
- Human Accept / Reject workflow with required rejection reasons
- Rejection-aware replacement generation
- Interactive Human Intent Graph (React Flow), including a full-screen Graph View
- Safe prototype renderer (allowlisted components, no eval or raw HTML)
- Deterministic verification (ARIA labels, structure, contrast, safety limits)
- Project deletion with full cleanup (nodes, edges, prototypes, screenshots)

## Tech stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Supabase (Postgres,
Auth, Storage, Row Level Security), Gemini API, React Flow, Zod.

## How it works

Feedback -> AI Analysis -> 3 Alternatives -> Human Decision -> Prototype -> Verification

1. **Feedback:** a user pastes customer feedback and an optional screenshot.
2. **AI Analysis:** Gemini extracts the core problem, supporting evidence and
   unsupported assumptions. These are shown as hypotheses, not facts.
3. **Alternatives:** Gemini proposes three fundamentally different solutions
   with trade-offs and assumptions.
4. **Human Decision:** the user accepts or rejects. Rejections require a
   reason, and the AI can generate a replacement that respects it.
5. **Prototype:** an accepted alternative becomes a validated JSON component
   tree, rendered through an allowlist.
6. **Verification:** deterministic server-side checks. No AI is involved.

In the graph, dashed borders mark AI hypotheses and solid borders mark human
decisions.

## Local setup


1. Clone the repo and run `npm install`
2. Create a `.env.local` file in the project root:

```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-publishable-key
   GEMINI_API_KEY=your-gemini-api-key
```

3. Run the SQL in `supabase/migrations/001_init.sql` (tables, RLS policies,
   storage bucket)

4. Run `npm run dev` and open http://localhost:3000

## Security

- The Gemini key is server-side only and never reaches the browser
- Row Level Security isolates each user's data
- AI output is validated with Zod and never executed as code
- The prototype renderer accepts only allowlisted components and props
- Uploads are limited to PNG/JPEG, 5 MB, in a private storage bucket
- Feedback is treated as untrusted data in every AI prompt

## Known limitations

- AI pipeline writes are multiple inserts, not a single transaction. A failure
  midway can leave partial data.
- Re-analyzing the same feedback creates duplicate problem and evidence nodes.
- Graph layout is automatic. Node positions are not saved after dragging.
- Stages B and C use the same Flash model. A Pro model was not configured.
- Verification checks structure, ARIA labels and the renderer's fixed color
  contrast. It does not run a real browser (Playwright was deferred).
- No team features or role-based access. Each project has one owner.
- Prototypes are low fidelity and may contain placeholder content. They do not
  prove business impact without user testing.
- The Gemini API can return temporary 503 errors under high demand. Retrying
  after a short wait resolves it.

## Deferred (future work)

- Playwright end-to-end tests and Vitest unit tests
- Team RBAC and SSO
- Saving graph layout
- Voice note transcription