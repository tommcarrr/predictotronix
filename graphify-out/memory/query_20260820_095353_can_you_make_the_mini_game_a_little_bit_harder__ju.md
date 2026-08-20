---
type: "query"
date: "2026-08-20T09:53:53.247504+00:00"
question: "Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["QuickMatchGame()", "PredictionsForm()"]
---

# Q: Can you make the mini game a little bit harder, just so the bar moves about 1.5 times faster? Also can you fix a bug where the last score box of a game week auto moves to the first one of the next gameweek?

## Answer

Expanded from the original request via graph vocabulary: [game, movement, score, scores, gameweek, selected, input, form, prediction, predictions, sequence]. QuickMatchGame defines the marker cycle timings; PredictionsForm performed a document-wide score-input query, causing focus to cross between gameweek forms. The marker cycles were divided by 1.5 and the focus query was scoped to the current form, with regression coverage.

## Outcome

- Signal: useful

## Source Nodes

- QuickMatchGame()
- PredictionsForm()