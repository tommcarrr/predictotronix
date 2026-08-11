---
type: "query"
date: "2026-08-11T11:47:55.651711+00:00"
question: "Why are they locked at all?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["isKickoffLocked()", "submitPredictions()", "getSeasonNow()", "PredictionsForm()"]
---

# Q: Why are they locked at all?

## Answer

Expanded from original query via graph vocab: [locked, locking, kickoff, prediction, predictions, clock, season, time]. Predictions lock per fixture at kickoff to prevent a participant changing a score after the match begins and information becomes available. The UI disables that fixture, the server action rejects it, and PostgreSQL RLS enforces the same deadline. Test/demo seasons use their simulated season clock, which can intentionally make fixtures appear locked; production uses real time.

## Outcome

- Signal: useful

## Source Nodes

- isKickoffLocked()
- submitPredictions()
- getSeasonNow()
- PredictionsForm()