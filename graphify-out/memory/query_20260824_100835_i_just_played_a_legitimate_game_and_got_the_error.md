---
type: "query"
date: "2026-08-24T10:08:35.973343+00:00"
question: "I just played a legitimate game and got the error: Your score could not be verified or saved."
contributor: "graphify"
outcome: "useful"
source_nodes: ["submitBreakoutRun()", "isValidBreakoutRunSummary()", "CeefaxBreakout()"]
---

# Q: I just played a legitimate game and got the error: Your score could not be verified or saved.

## Answer

Expanded from original query via vocab: [breakout, run, score, submit, duration, finished, hits, combo, level, server, validate, verified]. The client and database both imposed a 45-minute maximum and the one-use ticket expired after 45 wall-clock minutes; that was too strict for ten levels and pauses. The fix extends both limits to six hours, relaxes the impossible-speed threshold from 120ms to 25ms per hit, retains server score recomputation and replay protection, and logs server rejection details.

## Outcome

- Signal: useful

## Source Nodes

- submitBreakoutRun()
- isValidBreakoutRunSummary()
- CeefaxBreakout()