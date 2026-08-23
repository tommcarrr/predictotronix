---
type: "query"
date: "2026-08-23T11:25:42.010953+00:00"
question: "The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results."
contributor: "graphify"
outcome: "useful"
source_nodes: ["FplFixtureProvider", "syncFixtures", "syncResults"]
---

# Q: The syncing of results doesn't seem to be doing anything, the syncing of fixtures is showing the results but the games are still showing as being active even though they are finished. Can you work out what is going on? Try calling the API to check that you have the correct response mapped for the results.

## Answer

Expanded from original query via graph vocab: [sync, synchronization, fixture, fixtures, result, results, status, score, football, provider]. Live FPL API fixtures returned completed-score matches with started=true, finished=false, finished_provisional=true. FplFixtureProvider maps finished_provisional to 1H/live, so syncFixtures stores scores but leaves result_confirmed=false and syncResults skips each fixture because mapped status is not finished. The relevant correction is to map finished_provisional as a completed state (or represent it separately) and add coverage for that payload.

## Outcome

- Signal: useful

## Source Nodes

- FplFixtureProvider
- syncFixtures
- syncResults