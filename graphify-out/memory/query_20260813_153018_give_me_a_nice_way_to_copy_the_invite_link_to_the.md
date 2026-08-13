---
type: "query"
date: "2026-08-13T15:30:18.391580+00:00"
question: "Give me a nice way to copy the invite link to the clipboard."
contributor: "graphify"
outcome: "useful"
source_nodes: ["LeagueDetailPage", "InviteLinkCopy"]
---

# Q: Give me a nice way to copy the invite link to the clipboard.

## Answer

Expanded from original query via graph vocab: [invite, link]. The league invitation UI is rendered by LeagueDetailPage, which now passes its server-generated invite URL to the focused InviteLinkCopy client component. The component copies via navigator.clipboard, provides Copied confirmation and accessible live feedback, and leaves a selectable readonly URL plus a manual-copy message if clipboard access fails.

## Outcome

- Signal: useful

## Source Nodes

- LeagueDetailPage
- InviteLinkCopy