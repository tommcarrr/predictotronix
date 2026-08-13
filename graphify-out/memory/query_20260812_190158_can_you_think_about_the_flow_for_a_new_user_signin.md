---
type: "query"
date: "2026-08-12T19:01:58.545304+00:00"
question: "Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing."
contributor: "graphify"
outcome: "useful"
source_nodes: ["JoinPage()", "RegisterPage()", "signUp()", "LoginPage()", "signIn()", "submitJoinRequest()", "DashboardPage()", "ParticipantsAdminPage()"]
---

# Q: Can you think about the flow for a new user signing up from an invite link and figure out if it works. I want the flow to be optimized for ease of use and first impression. Let me know what you come up with before implementing.

## Answer

Expanded from original query via graph vocab: [invite, register, auth, login, session, email, user, dashboard, team]. The current new-user invite flow is not continuous: /join/[code] sends anonymous users to /register with a from value, but RegisterPage, signUp, LoginPage, and signIn discard it, so users land on the generic dashboard and must reopen the invite. Registration errors are also hidden, invite validity and league identity are not shown before signup, and approval actions allow only super admins despite league-admin access. The recommended journey is invite-specific landing, preserved safe return path across register/login, direct request submission, clear pending state, and post-approval onboarding.

## Outcome

- Signal: useful

## Source Nodes

- JoinPage()
- RegisterPage()
- signUp()
- LoginPage()
- signIn()
- submitJoinRequest()
- DashboardPage()
- ParticipantsAdminPage()