---
type: "query"
date: "2026-08-24T10:23:42.276910+00:00"
question: "I played for 5-10 minutes. Would the duration or speed changes fix the verification failure?"
contributor: "graphify"
outcome: "corrected"
correction: "The primary cause was an ambiguous participant_id reference in the PL/pgSQL submission function, not the 45-minute limit."
source_nodes: ["submitBreakoutRun()", "verifiedMigration", "breakout-migration.test.ts"]
---

# Q: I played for 5-10 minutes. Would the duration or speed changes fix the verification failure?

## Answer

Expanded from original query via vocab: [breakout, submit, score, verified, migration, participant, run, server, validate, duration, error]. No: a 5-10 minute game would not hit the former 45-minute cap and would normally satisfy the aggregate speed check. PostgreSQL's default ambiguity handling exposes the real failure: submit_breakout_run returns an output variable named participant_id while its run lookup used an unqualified participant_id column, causing a runtime ambiguity error before validation. Migration 019 qualifies the lookup through the breakout_run alias.

## Outcome

- Signal: corrected
- Correction: The primary cause was an ambiguous participant_id reference in the PL/pgSQL submission function, not the 45-minute limit.

## Source Nodes

- submitBreakoutRun()
- verifiedMigration
- breakout-migration.test.ts