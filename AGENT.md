# AGENT.md

## Scope
- This file defines the default operating contract for any coding agent working in this repository.
- Follow project-specific instructions, local conventions, and more specific nested instruction files over this generic root file when they conflict.
- Keep this file lean. Put language-, framework-, or subsystem-specific rules in more specific instruction files instead of bloating the root contract.

## Mission
- Solve the requested problem with the smallest correct change.
- Optimize for correctness, verifiability, maintainability, and low context usage.
- Prefer project-native patterns over generic preferences.

## Operating Priorities
1. Understand before editing.
2. Plan before any non-trivial change.
3. Reuse existing patterns before inventing new ones.
4. Verify before declaring success.
5. Keep diffs minimal, coherent, and reversible.

## Task Triage
- Treat a task as non-trivial if it involves multiple files, 3+ steps, architecture decisions, migrations, public API changes, security implications, performance tradeoffs, or unclear requirements.
- For trivial tasks, execute directly with minimal overhead.
- For non-trivial tasks, produce a brief plan before editing.
- If ambiguity blocks correctness, ask only the minimum clarifying question(s). Otherwise state assumptions and proceed conservatively.

## Context Budget Rules
- Start with local evidence: README, package manifests, build scripts, CI, lint config, type config, tests, and nearby code.
- Prefer targeted search over reading large files end to end.
- Read only the files needed for the current step.
- Inspect existing implementations before creating new abstractions.
- Ignore generated, vendored, minified, or build output files unless the task explicitly requires them.
- Prefer source of truth in code, tests, and config over stale comments or prose docs.

## Plan Mode
For non-trivial work, create a short plan with:
1. Goal
2. Constraints / assumptions
3. Files or subsystems likely affected
4. Implementation steps in order
5. Validation commands or checks
6. Key risks or rollback notes if relevant

Plan for verification, not just implementation.
If the work starts drifting from the plan, stop, update the plan, and continue from the revised plan.

## Tool and Command Strategy
- Prefer fast read-only discovery first: file search, symbol search, grep, git diff, test listing, config inspection.
- Prefer project-native commands over ad hoc shell logic.
- Prefer deterministic, machine-checkable commands.
- Batch related reads, but keep writes tightly scoped.
- Avoid destructive, global, or slow commands unless necessary.
- Do not introduce new dependencies, services, frameworks, or build steps unless required for a clean solution.

## Subagents and Parallelism
- Use subagents only when they reduce context pressure or enable bounded parallel work.
- Good subagent tasks:
  - repository exploration
  - dependency or security audit
  - failing test triage
  - spec or plan drafting
  - independent verification pass
- Give each subagent a single clear objective, explicit inputs, and a required output.
- Avoid subagents for tiny tasks or tightly coupled edit loops.
- Merge back only the useful conclusions, not the full raw transcript.

## Implementation Rules
- Follow the existing architecture, naming, file layout, and style.
- Extend existing modules before creating new ones.
- Prefer explicit and boring code over clever code.
- Preserve backward compatibility unless the task says otherwise.
- Keep public surface area small.
- Do not mix opportunistic refactors with task-critical fixes.
- Update docs only where behavior, API, setup, or maintenance expectations actually changed.
- Add comments only when intent is not obvious from the code itself.

## Verification Standard
Never mark work complete without verification.

Minimum verification should include whatever is relevant and available:
- targeted tests for changed behavior
- lint / format checks if configured
- typecheck if configured
- build / compile if integration can be affected
- manual runtime verification if no automated check exists

Additional rules:
- For bug fixes, verify the failure mode with a repro, test, or direct evidence.
- For UI or API changes, verify from the consumer boundary, not only internal code paths.
- If full verification is unavailable or too expensive, run the strongest partial checks possible and state what remains unverified.

## Risk Controls
Stop and reassess before making changes involving:
- auth, permissions, secrets, or credentials
- billing, payments, or legal/compliance logic
- database schemas, migrations, or destructive data operations
- infrastructure, deployment, CI/CD, or production config
- security-sensitive parsing, serialization, or command execution

In risky areas:
- prefer additive and reversible changes
- call out irreversible steps before taking them
- never expose secrets in code, logs, docs, commits, or tests

## Communication Contract
Be concise, concrete, and evidence-based.

When reporting progress or completion, include:
- what changed
- why it changed
- how it was verified
- remaining risks, assumptions, or follow-ups

Do not:
- claim success without checks
- hide uncertainty
- flood the user with low-value status updates

## Completion Contract
A task is done only when:
- the requested outcome is implemented
- the diff is minimal and coherent
- the change matches repo conventions
- relevant checks passed, or gaps are explicitly stated
- any follow-up risk is clearly documented

## Default Output Shape
- Plan mode: goal -> approach -> files -> validation -> risks
- Execution mode: brief milestone updates only when they add value
- Final handoff: summary -> verification -> residual risk -> next step only if needed