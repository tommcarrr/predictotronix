---
type: "query"
date: "2026-08-26T21:56:57.271382+00:00"
question: "How could someone be showing up as Unknown Participant?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["FixturesAdminPage()", "removeSeasonParticipant()"]
---

# Q: How could someone be showing up as Unknown Participant?

## Answer

Expanded from original query via graph vocab: [participant, participants, prediction, fixture, outcome, season, display, name]. The outcome page builds names only from season_participants for the selected season, but predictions are independently keyed to participants and seasons. A prediction can remain after its participant is removed from season_participants, so the name map misses that participant and the UI uses the Unknown participant fallback. The participant record itself must normally still exist because predictions.participant_id has an ON DELETE CASCADE foreign key.

## Outcome

- Signal: useful

## Source Nodes

- FixturesAdminPage()
- removeSeasonParticipant()