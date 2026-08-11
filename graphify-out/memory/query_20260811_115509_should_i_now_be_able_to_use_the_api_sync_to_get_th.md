---
type: "query"
date: "2026-08-11T11:55:09.264398+00:00"
question: "Should I now be able to use the API sync to get the real fixtures for the upcoming season?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["triggerFixtureSync()", "syncFixtures()", "ApiFootballProvider", "getEnvironmentPolicy()"]
---

# Q: Should I now be able to use the API sync to get the real fixtures for the upcoming season?

## Answer

Expanded from original query via graph vocab: [api, sync, synchronization, fixture, fixtures, football, season, production, trigger]. The prediction-dashboard fix does not enable API sync. Sync works only for an active production season with API-Football league and season identifiers, a RAPIDAPI_KEY, and an environment where external sync is enabled. It fetches and upserts real fixtures, but does not create gameweeks: it only attaches a fixture when its API round matches an existing gameweek api_football_round; otherwise gameweek_id is null and the prediction dashboard cannot surface it.

## Outcome

- Signal: useful

## Source Nodes

- triggerFixtureSync()
- syncFixtures()
- ApiFootballProvider
- getEnvironmentPolicy()