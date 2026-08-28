---
type: "query"
date: "2026-08-28T06:24:41.097944+00:00"
question: "Once you've done this, can you also fix the styling on the admin dashboard, the policy links appear right at the bottom below the menu and cause a vertical scrollbar. Surely they could just be links at the bottom of the menu."
contributor: "graphify"
outcome: "useful"
source_nodes: ["AdminShell()", "SiteFooter()", "app/layout.tsx"]
---

# Q: Once you've done this, can you also fix the styling on the admin dashboard, the policy links appear right at the bottom below the menu and cause a vertical scrollbar. Surely they could just be links at the bottom of the menu.

## Answer

Expanded from graph vocabulary: [admin, cookie, dashboard, footer, legal, link, menu, navigation, policy, privacy, shell]. AdminShell renders a min-height-screen shell while RootLayout adds SiteFooter afterward, causing the extra vertical space. Put Privacy and Cookies in AdminShell's bottom sidebar panel, make that panel the auto-margin bottom anchor, and hide SiteFooter whenever body contains .admin-shell.

## Outcome

- Signal: useful

## Source Nodes

- AdminShell()
- SiteFooter()
- app/layout.tsx