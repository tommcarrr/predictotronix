---
type: "query"
date: "2026-09-01T20:51:11.562293+00:00"
question: "The participants page is now giving React error 441 when I navigate to it"
contributor: "graphify"
outcome: "useful"
source_nodes: ["ParticipantsAdminPage()", "participants/page.tsx", "AdminNotice()"]
---

# Q: The participants page is now giving React error 441 when I navigate to it

## Answer

Expanded from the original query via graph vocabulary: [participants, page, admin, unattached, users, dialog, form, action, delete, render, tabs, user]. React 441 is the production wrapper for a Server Component render failure. ParticipantsAdminPage called list_unattached_auth_users for every super-admin visit and threw on an expected RPC error, so a missing production migration crashed every tab. The fix gates the RPC to the unattached tab and conditionally renders an actionable migration warning rather than throwing.

## Outcome

- Signal: useful

## Source Nodes

- ParticipantsAdminPage()
- participants/page.tsx
- AdminNotice()