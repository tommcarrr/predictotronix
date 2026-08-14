# Predictotronix guide for superadmins

This guide covers the **superadmin** responsibilities that sit above normal league operations: creating and managing leagues, assigning league administrators, managing invitations, working across leagues and safely using test tools. League admins can run seasons, people, predictions, fixtures, results and standings within their assigned leagues.

## Quick reference

| Task | Where to go |
| --- | --- |
| Check current state | **Admin → Overview** |
| Change working league/season | **Change workspace** |
| Create/manage leagues and invites | **Leagues** |
| Create/manage season lifecycle | **Seasons** |
| Approve and enrol people | **People** |
| Enter picks for a player | **Predictions** |
| Sync fixtures/results | **Fixtures & results → Sync** |
| Review/export tables | **Standings** |
| Simulate a test season | **Test tools** |

## 1. Always check the current workspace

Most admin pages act on the league and season shown under **Current workspace**.

1. Select **Change workspace** in the admin header.
2. Choose the league.
3. Choose the season.

Changing league automatically selects that league's active season when available; otherwise it selects the most recently created season. Recheck the header before approving a request, changing enrolment, entering predictions, syncing or exporting.

## 2. Create a league

1. Open **Leagues**.
2. Select **Create league**.
3. Enter a recognisable **League name**.
4. Enter a unique **URL identifier** using lowercase letters, numbers and hyphens only.
5. Select **Create league**.

The invitation is active by default, and your account is assigned as a league admin. Select the league under **Change workspace** before continuing.

## 3. Manage invitations

1. Open **Leagues** and select **Manage league**.
2. Open the **Invites** tab.
3. Use **Copy invitation link** to share the link, or **Open join page** to test it.

Anyone with an active link can request access; they are not enrolled until an admin approves them.

- **Deactivate link** stops new requests without changing the link.
- **Activate link** makes the same link usable again.
- **Regenerate** immediately invalidates the old link and creates a new one. Share the replacement with anyone who still needs access.

## 4. Assign a league admin

The user must register before you can assign them.

1. Open **Leagues → Manage league → Admins**.
2. Under **Assign administrator**, choose a registered user.
3. Select **Assign admin**.

League admins can access only their assigned leagues. They can review join requests and edit participant display names, but they cannot configure leagues/seasons, change enrolments, override predictions, sync data or export standings.

The current interface does not remove league-admin assignments. If access must be revoked, follow the project's controlled database administration process rather than editing unrelated data.

## 5. Create and activate a season

1. Select the intended league under **Change workspace**.
2. Open **Seasons → Create season**.
3. Enter a name players will recognise.
4. Choose the type:
   - **Production** for the real competition;
   - **Test** for controlled testing; or
   - **Demo** for demonstrations.
5. For a production season, enter both the **API-Football league ID** and **API-Football season**. They may be empty for test/demo seasons.
6. Select **Create in setup**.
7. Open **Manage season** and select **Activate season** when configuration is ready.

The lifecycle is:

`setup → active → completed → archived`

A setup season can also be archived directly. Archived seasons cannot be reactivated. Standings and history remain available after archiving.

Season type and fixture-source identifiers cannot be edited in the current interface. If they are wrong, archive the season and create a replacement.

## 6. Manage people

Open **People** after selecting the correct league and season.

### Review requests

1. Open **Join requests**.
2. Check the player identity.
3. Select **Approve** to create/update their player record and enrol them in the selected season, or **Reject** to close the request.

Approval is disabled without a selected season.

### Add someone from another season

1. Open **Members**.
2. Select **Add existing**.
3. Choose a participant who has appeared in another season in this league.
4. Select **Add**.

### Add an offline participant

1. Open **Members → Add offline**.
2. Enter a display name and, optionally, an email address.
3. Select **Add participant**.

Offline participants have no sign-in. Use **Predictions** to enter their picks.

### Edit or remove a participant

- Select **Edit** to change a display name (2–80 characters).
- Select **Remove** to remove the person from the selected season. This changes season enrolment; it does not delete their reusable participant record.

## 7. Enter or amend predictions for a player

1. Select the correct season.
2. Open **Predictions**.
3. Choose a gameweek.
4. Choose the participant. Status cards show **Awaiting picks**, **In progress** or **Ready**, plus completed/total fixtures.
5. Enter at least one complete score.
6. Select **Save predictions**.

Superadmin entries remain editable after kickoff and can be used for offline players or authorised corrections. Confirm the player and gameweek carefully; this is an override of the normal player lock. Existing awarded points are shown where available.

## 8. Synchronise fixtures and results

1. Select the production season.
2. Open **Fixtures & results → Sync**.
3. Select **Sync Fixtures** to import/update the schedule.
4. Review the on-screen backend log.
5. Select **Sync Results** to import results and score affected predictions.
6. Open **Fixtures & results** to inspect gameweek, match, kickoff, status, score, confirmation and last-sync time.

Manual sync is enabled only when the selected season is:

- **active**;
- type **production**; and
- configured with both API-Football identifiers.

The production deployment should also run the secured scheduled jobs for fixture sync, result sync and reminders. Manual sync is useful for setup, verification and recovery; investigate warnings or failures in the console rather than repeatedly retrying without reading the log.

## 9. Review and publish standings

1. Open **Standings**.
2. Choose **Overall league table** or a gameweek under **View standings**.
3. Review rank, points, exact scores and the number of predictions scored.

Ranking uses total points, then exact-score count, then display name. Players tied on points and exact scores share a position.

To publish or analyse results:

- select **Export season (.xlsx)** for the complete workbook; or
- select **Export this view**, choose **CSV**, **Plain text**, **Markdown** or **HTML table**, then **Copy** or **Download**.

Standings update from confirmed results. If no scores appear, confirm that results have synced and predictions were scored.

## 10. Complete, archive and delete safely

### Complete or archive a season

1. Open **Seasons → Manage season**.
2. For an active season, select **Mark completed**.
3. From completed (or setup), select **Archive season** and confirm.

### Delete a season

1. Archive it first.
2. Open **Manage season → Danger zone**.
3. Select **Delete season**.
4. Type the exact season name and select **Delete permanently**.

This permanently removes the season's fixtures, predictions and scores.

### Delete a league

1. Archive every season in the league.
2. Open **Leagues → Manage league → Danger zone**.
3. Select **Delete league**.
4. Type the exact league name and select **Delete permanently**.

League and season deletion cannot be undone. Export anything that must be retained first.

## 11. Use test-season tools

**Test tools** works only for an **active test or demo season**. Never use test data as a substitute for a production season.

Available tabs and actions are:

- **Clock:** place a gameweek before kickoff, in progress or after kickoff, then return it to real time. Clock changes require the protected staging environment and matching staging database guard.
- **Fixtures:** inject and score an individual result or mark a fixture postponed.
- **Gameweek:** fast-forward the next incomplete gameweek with random results and scoring.
- **Notifications:** send a test email or SMS to an enrolled participant. Live test-notification controls require the protected staging guard.

Before changing the clock or sending notifications, verify that the deployment is staging and uses the dedicated staging Supabase project. See [the staging runbook](./staging.md) for environment safeguards, reset operations and acceptance checks.

## 12. Routine operating checklists

### Before a production season starts

- [ ] Create the league and season with the correct type and API identifiers.
- [ ] Copy and test the active invitation link.
- [ ] Assign at least one league admin.
- [ ] Approve requests into the intended season.
- [ ] Add any offline or returning participants.
- [ ] Activate the season.
- [ ] Run **Sync Fixtures** and inspect the imported schedule.
- [ ] Confirm scheduled fixture/result/reminder jobs are configured outside the app.

### During each gameweek

- [ ] Check fixture changes and sync status.
- [ ] Review participant completion and enter authorised offline/missed picks if required.
- [ ] After matches, sync results and inspect warnings.
- [ ] Confirm scores and standings.
- [ ] Export the table in the format used for league communications.

### At season end

- [ ] Sync and confirm all final results.
- [ ] Check the final standings and export the season workbook.
- [ ] Mark the season completed.
- [ ] Archive it when no further corrections are needed.

## Troubleshooting

- **A control is missing:** check the signed-in role and selected league. League operations require an assignment to that league; league settings and test tools remain superadmin-only.
- **The wrong data is showing:** verify the league and season under **Current workspace**.
- **Approve is disabled:** select or create a season.
- **A player sees no fixtures:** confirm their enrolment, season status and fixture import.
- **Sync buttons are disabled:** the season must be active production data with both API identifiers.
- **Sync reports warnings/errors:** read the console details and check provider credentials/configuration before retrying.
- **Standings are empty:** results must be confirmed and scored.
- **Test tools are unavailable:** select an active test/demo season; clock and live notification controls additionally require a correctly guarded staging deployment.
- **Deletion is refused:** archive the season first; for a league, archive every season. Type the exact displayed name.
