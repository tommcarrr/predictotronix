---
type: "query"
date: "2026-08-26T22:12:46.521230+00:00"
question: "Can you exclude any results that are not ascribed to a person who is actively a part of the league/season?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["FixturesAdminPage()", "getActiveFixtureOutcomePrediction()"]
---

# Q: Can you exclude any results that are not ascribed to a person who is actively a part of the league/season?

## Answer

Expanded from original query via graph vocab: [active, participant, prediction, fixture, outcome, season, league, remove]. Implemented getActiveFixtureOutcomePrediction so fixture outcomes are created only when the prediction participant_id exists in the selected season's current season_participants name map. Removed participants and other non-members are skipped. Added a regression test for active versus removed participants.

## Outcome

- Signal: useful

## Source Nodes

- FixturesAdminPage()
- getActiveFixtureOutcomePrediction()