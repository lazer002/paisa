# Agent Instructions

## Always use the feature-workflow skill

On **every user prompt** — before answering or writing any code — load the skill at `.agents/skills/feature-workflow/SKILL.md` (via the skill tool, name: `feature-workflow`) and follow it.

- Multi-file features and non-trivial changes: follow all 7 phases (plan → roadmap → approach comparison → implement → impact review → test → regression check).
- Small edits and fixes: apply the scaled-down flow (plan → change → diff review → checks → regression confirmation).
- Pure questions: answer directly; switch to the full flow if the answer leads to code changes.

Never skip the skill because a request looks simple. If the user explicitly says to skip a phase, follow their instruction.
