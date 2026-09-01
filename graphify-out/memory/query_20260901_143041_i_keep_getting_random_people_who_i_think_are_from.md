---
type: "query"
date: "2026-09-01T14:30:41.227675+00:00"
question: "I keep getting random people who I think are from bot accounts signing up to the site. How would I add some protection against this?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["RegisterPage()", "signUp()", "register/page.tsx", "auth/actions.ts", "InviteAuthRoute"]
---

# Q: I keep getting random people who I think are from bot accounts signing up to the site. How would I add some protection against this?

## Answer

Expanded from original query via graph vocab: [register, sign, auth, account, user, email, verify, rate, limit, invite]. The public RegisterPage posts to signUp, which currently validates only display name, email shape, and password length before calling Supabase auth.signUp. There is no CAPTCHA, honeypot, or application rate limit in that path. Recommend enforcing valid invite codes server-side if public registration is unnecessary, adding Cloudflare Turnstile and passing captchaToken to Supabase signUp, enabling email confirmation in the hosted Supabase project, and reviewing hosted Auth rate limits. Local config has CAPTCHA commented out and email confirmations disabled; hosted settings must be checked separately.

## Outcome

- Signal: useful

## Source Nodes

- RegisterPage()
- signUp()
- register/page.tsx
- auth/actions.ts
- InviteAuthRoute