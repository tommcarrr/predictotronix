---
type: "query"
date: "2026-09-01T21:48:32.367681+00:00"
question: "I've run migration 021, but the Unattached users tab is still unavailable"
contributor: "graphify"
outcome: "corrected"
correction: "The remaining failure after migration 021 is an ambiguous user_id reference inside list_unattached_auth_users; apply migration 022, not migration 021 again."
source_nodes: ["ParticipantsAdminPage()", "unattached-users-migration.test.ts", "Database"]
---

# Q: I've run migration 021, but the Unattached users tab is still unavailable

## Answer

Expanded from the original query via graph vocabulary: [unattached, users, migration, rpc, auth, participant, participants, admin, database, error, role, league]. Migration 021 created list_unattached_auth_users with RETURNS TABLE(user_id ...), but its PL/pgSQL body also used unqualified user_id column references. PostgreSQL resolves those as ambiguous output-variable versus table-column references at execution time. Migration 022 replaces the function with fully qualified table aliases while preserving its signature, security-definer setting, and service-role grants.

## Outcome

- Signal: corrected
- Correction: The remaining failure after migration 021 is an ambiguous user_id reference inside list_unattached_auth_users; apply migration 022, not migration 021 again.

## Source Nodes

- ParticipantsAdminPage()
- unattached-users-migration.test.ts
- Database