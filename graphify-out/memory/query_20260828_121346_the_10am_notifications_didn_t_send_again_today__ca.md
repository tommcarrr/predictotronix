---
type: "query"
date: "2026-08-28T12:13:46.135134+00:00"
question: "The 10am notifications didn't send again today. Can you have a look for any bugs?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["send-reminders/route.ts", "getDueReminderWindows()", "claimReminderDelivery()"]
---

# Q: The 10am notifications didn't send again today. Can you have a look for any bugs?

## Answer

Expanded from original query via vocab: [cron, daily, notification, notifications, reminder, scheduled, send, settings, time, user, users]. Diagnosed three concrete risks: notification_preferences is a PostgREST to-one object but route indexes [0], so saved settings are ignored; getDueReminderWindows intentionally returns only the latest due window, so a missed 10am occurrence can be erased by the two-hour occurrence; production cron provisioning is not declared in render.yaml or GitHub workflows and must be manually configured, so invocation is not guaranteed. Also processing delivery claims are treated as duplicates indefinitely after a crash.

## Outcome

- Signal: useful

## Source Nodes

- send-reminders/route.ts
- getDueReminderWindows()
- claimReminderDelivery()