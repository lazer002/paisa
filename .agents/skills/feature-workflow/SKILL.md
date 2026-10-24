---
name: feature-workflow
description: Use on EVERY user prompt without exception — questions, fixes, small edits, and new features alike. Enforces a plan → roadmap → approach comparison → implement → impact review → test → regression check workflow so new work does not break existing features.
---

# Feature Workflow (Safe Multi-File Changes)

Apply this skill to **every** user prompt. Do not skip the skill because a request seems small.

Scale the phases to the size of the task:

- **Multi-file feature / non-trivial change** — follow all 7 phases in order.
- **Single-file edit or small fix** — still follow the flow, but keep it light: brief plan, make the change, review the diff for impact, run the relevant checks, confirm no regressions.
- **Question / no code change** — answer directly; if the answer leads to changes, switch to the full flow.

If the user explicitly says to skip a phase, follow their instruction.

## Phase 1 — Understand and Plan

1. Restate the goal in one sentence.
2. Read the files likely to be involved before proposing anything.
3. List what the feature needs: data model, API endpoints, UI, state, permissions.
4. Write a short step plan (use the todo tool for multi-step work) covering only the steps the feature actually needs — no extras.

## Phase 2 — Roadmap

Write a concrete roadmap before touching code:

- **Files to change** — every file, with one line on what changes in it and why.
- **Order of changes** — the sequence that keeps the app working at each step (e.g. model → validation → route → client state → UI).
- **Risks** — which existing features could be affected and how.
- **Verification** — which commands prove each step works.

## Phase 3 — Approach Comparison (Effort vs Reliability)

When more than one way to build the feature exists (usually 2–4 options):

1. List each option briefly.
2. Score each on **effort** (size, complexity, time) and **reliability** (risk of bugs, risk to existing features, testability).
3. Present the comparison to the user before implementing when the options differ meaningfully in direction or scope. Otherwise pick the highest-reliability option at reasonable effort and state why.
4. Prefer the approach that touches the fewest existing code paths over the cleverest one.

## Phase 4 — Implement

- Make changes in the roadmap's order, smallest safe increments.
- Match the project's existing conventions: ES modules, Mongoose models in `server/src/models/`, Express routes/services under `server/src/`, React 19 + Redux Toolkit + Tailwind under `client/src/`.
- Write meaningful code: clear names, no dead code, no speculative abstraction.
- Never weaken, delete, or disable existing behavior to make the new feature fit. If a conflict surfaces, stop and report it.

## Phase 5 — Impact Review

After the changes, review what was affected:

1. `git diff` — go through every changed file and state what each change affects.
2. Check each file the roadmap listed under Risks: does the new code change its behavior, contracts, or assumptions?
3. Look for ripple effects: shared components, shared reducers, middleware, model schemas used elsewhere, route ordering, validation schemas.
4. Fix anything unintended before testing.

## Phase 6 — Test

Run the project's checks, tailored to which side changed:

- Server: `npm test` and `npm run check` in `server/`
- Client: `npm run lint` and `npm run build` in `client/` (the build runs `tsc -b`, so it is the typecheck)
- Full: `npm run build` from the repo root

Then exercise the delivered behavior the way the user will use it: hit the endpoint with curl/HTTP requests, or verify the UI flow through the DOM. A passing build or exit code alone does not prove the feature works.

## Phase 7 — Regression Check (New Change Must Not Create New Bugs)

Before declaring done:

1. Verify the new feature's main path and at least one edge case.
2. Re-verify the existing features that share files with the change (from the roadmap's risk list) — e.g. if a shared component changed, check the other pages using it; if a model schema changed, check other endpoints using that model.
3. If any existing test covers the touched area, run it and confirm it passes.
4. Report honestly: name any checks that failed or could not run as limitations, never as passes. Never skip tests, weaken assertions, or add suppressions just to make checks pass.

## Output

End with a short summary: what was built, files changed, approaches considered, checks run and their results, and anything the user still needs to do.
