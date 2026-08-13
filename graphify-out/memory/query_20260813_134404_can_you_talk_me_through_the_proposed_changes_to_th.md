---
type: "query"
date: "2026-08-13T13:44:04.641742+00:00"
question: "Can you talk me through the proposed changes to the flow to make this work?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["JoinPage()", "RegisterPage()", "LoginPage()", "signUp()", "signIn()", "submitJoinRequest()", "approveJoinRequest()", "ParticipantsAdminPage()", "DashboardPage()"]
---

# Q: Can you talk me through the proposed changes to the flow to make this work?

## Answer

Expanded via graph vocab: [invite, join, register, login, auth, session, request, approve, league, participant, dashboard, admin]. Proposed flow: validate and show the league before auth; carry a server-validated invite continuation through registration, login, errors, and optional confirmation; combine account creation/sign-in with an explicit request-to-join action; revalidate and create the request idempotently on the server; show a league-specific pending state; authorize league admins for their own requests and approve enrolment atomically into a valid league season; then show a welcome state on the first approved dashboard visit. Handle invalid, inactive, duplicate, rejected, already-member, and no-season cases explicitly.

## Outcome

- Signal: useful

## Source Nodes

- JoinPage()
- RegisterPage()
- LoginPage()
- signUp()
- signIn()
- submitJoinRequest()
- approveJoinRequest()
- ParticipantsAdminPage()
- DashboardPage()