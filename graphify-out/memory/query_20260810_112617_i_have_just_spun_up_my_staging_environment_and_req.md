---
type: "query"
date: "2026-08-10T11:26:17.030897+00:00"
question: "I have just spun up my staging environment and requested to join a league with a user, I can see the join request in my DB table, but it is not showing in the UI."
contributor: "graphify"
outcome: "useful"
source_nodes: ["createServiceClient()", "ParticipantsAdminPage()", "submitJoinRequest()"]
---

# Q: I have just spun up my staging environment and requested to join a league with a user, I can see the join request in my DB table, but it is not showing in the UI.

## Answer

Expanded from original query via graph vocab: [join, request, invite, league, participant, notification, dashboard, staging, user]. The admin Participants page used createServiceClient(), but that function constructed an SSR cookie client. Supabase's installed fetchWithAuth prefers the signed-in user's access token, so join_requests_select_own RLS hid requests belonging to other users. Fixed createServiceClient() to use a cookie-free @supabase/supabase-js client with the service-role key; added a regression test. npm run verify passed 47 tests and the production build.

## Outcome

- Signal: useful

## Source Nodes

- createServiceClient()
- ParticipantsAdminPage()
- submitJoinRequest()