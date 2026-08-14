# Predictotronix guide for league admins

League admins run the competition inside their assigned leagues. They can manage seasons, people, predictions, fixtures, results and standings. Superadmins retain league creation and settings, administrator assignments, invitation management and system/test tools.

## Quick reference

| Task | Where to go |
| --- | --- |
| Review league health | **Overview** |
| Change league or season | **Change workspace** |
| Review requests and manage members | **People** |
| Enter or amend player predictions | **Predictions** |
| Synchronise fixtures and results | **Fixtures & results** |
| Review and export tables | **Standings** |
| Create and manage seasons | **Seasons** |

## 1. Open and select the workspace

Sign in with the account assigned as a league admin and select **Admin panel** from the dashboard. Under **Change workspace**, select the league and season you intend to operate. Only leagues assigned to your account appear.

The selected league scopes requests and available seasons. The selected season scopes members, predictions, fixtures, results and standings. Check both before making a change.

## 2. Manage seasons

Open **Seasons** to create a season, configure its football-provider identifiers and move it through setup, active, completed and archived states. An archived season can be permanently deleted after confirming its exact name.

Creating or deleting a season is an operation inside a league and is available to that league's admins. Creating, deleting or changing the league itself remains a superadmin responsibility.

## 3. Manage people

Use **People → Join requests** to approve or reject requests. Approval enrols the person into the selected season.

Use **People → Members** to:

- correct a display name;
- add an existing league participant to the selected season;
- create and enrol an offline participant; or
- remove a participant from the selected season.

## 4. Manage predictions

Open **Predictions** to enter or amend predictions for registered and offline participants. Administrative entries are audited and may be corrected after kickoff. If a confirmed result already exists, the changed prediction is rescored.

## 5. Manage fixtures and results

Use **Fixtures & results** to synchronise production fixtures, synchronise completed results and correct an incorrect score. Correcting a result recalculates affected prediction scores.

External synchronisation remains subject to the environment policy and the selected production season's provider configuration.

## 6. Review and export standings

Use **Standings** to review season and gameweek tables and export leaderboard or full-season workbooks. Every export is checked against your assigned league on the server.

## Reserved for superadmins

Contact a superadmin to:

- create or delete a league;
- change league settings;
- assign or revoke league administrators;
- enable, disable or regenerate invitation links;
- access another league without an assignment;
- use test notifications, simulated clocks/results or other system/test tools.

## Security and troubleshooting

- Every operation is authorized against the league that owns the submitted season, fixture or participant; changing an ID cannot grant access to another league.
- If **Admin panel** is missing, ask a superadmin to assign your registered account to the league, then refresh or sign in again.
- If a league is missing, your account is not assigned to it.
- If fixture synchronisation is unavailable, confirm the season is active, production-type and has provider identifiers configured.
- If a player cannot use an invitation, ask a superadmin to confirm that the league invitation remains active.
