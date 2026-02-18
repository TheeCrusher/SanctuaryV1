# Sanctuary — Development Costs & Services

**Last Updated:** February 17, 2026

---

## Monthly Summary

| Service | Plan | Monthly Cost | Purpose |
|---------|------|-------------|---------|
| Claude (Anthropic) | Max | $125.00 | AI development (Claude.ai + Claude Code) |
| GitHub | Pro | $4.00 | Repos, Codespaces, Actions |
| GitHub Copilot | Free | $0.00 | AI pair programmer (minimal use) |
| Render — Backend | Free | $0.00 | Node.js/Express API hosting |
| Render — Database | Free | $0.00 | PostgreSQL (sanctuary-db) |
| Vercel | Free | $0.00 | Frontend hosting |
| v0 (by Vercel) | Free | $0.00 | AI UI generator (minimal use) |
| Google Places API | Free tier | $0.00 | Church search & photos ($200/mo free credit) |
| Resend | Free | $0.00 | Password reset emails |
| **TOTAL** | | **$129.00/mo** | |

---

## Service Details & Upgrade Triggers

### Claude (Anthropic) — $125/mo
- **What it covers:** All Claude usage — claude.ai web app, mobile app, and Claude Code in the codespace. One subscription, one pool of resources.
- **Upgrade trigger:** If you consistently hit usage limits during heavy development sessions.

### GitHub Pro — $4/mo
- **Key limits:** 180 core-hours Codespaces compute, 20GB Codespaces storage, 3,000 Actions minutes/mo
- **Upgrade trigger:** No individual plan above Pro. Only Team/Enterprise (for organizations). You're at the top.
- **Tip:** Always stop your codespace when done. A 4-core machine running 24/7 burns 180 hours in ~2 days. Set an auto-shutdown idle timeout in GitHub settings.

### GitHub Copilot — Free
- **What it is:** AI code suggestions in your editor. You have it but aren't actively relying on it (Claude Code handles development).
- **Upgrade trigger:** Copilot Pro exists but not needed — Claude Code is your primary AI dev tool.

### Render Backend — Free
- **What it hosts:** Express + Socket.io API server (sanctuary-api)
- **Limits:** Spins down after inactivity (cold starts), limited bandwidth
- **Upgrade trigger:** When real users start using the app and cold start delays become unacceptable. Starter plan is $7/mo.

### Render PostgreSQL — Free
- **Current specs:** 256 MB RAM, 0.1 CPU, 1 GB storage
- **Limits:** Free databases may be deleted after trial period. Not meant for persistent production data.
- **Upgrade tiers:**
  - Basic: $6/mo (reliable, persistent — first real upgrade)
  - Pro: $55/mo (production scale)
  - Accelerated: $160/mo (memory-optimized)
- **Upgrade trigger:** The moment real users are on the app and their data needs to be safe. **Basic at $6/mo is the minimum for real users.**

### Vercel — Free
- **What it hosts:** React frontend (sanctuary-v1.vercel.app)
- **Limits:** Bandwidth and build minute caps (generous for small apps)
- **Upgrade trigger:** High traffic or need for team features. Pro is $20/mo but unlikely needed soon.

### v0 (by Vercel) — Free
- **What it is:** AI tool for generating UI components from text/image prompts
- **Limits:** 7 messages/day, $5 monthly credits
- **Upgrade trigger:** Not needed. You build everything in Claude Code. v0 is a side tool at best. Premium is $20/mo if you ever want it.

### Google Places API — Free ($200/mo credit)
- **What it does:** Church search and photos in the app
- **Cost per use:** ~$0.03/search, ~$0.007/photo
- **Upgrade trigger:** You'd need to exceed $200/mo in API calls, which would mean thousands of searches. Very unlikely at current scale.

### Resend — Free
- **What it does:** Sends password reset emails
- **Limits:** 100 emails/day, 3,000 emails/month on free tier
- **Upgrade trigger:** If you add more email features (appointment reminders, notifications) and exceed the free limits. Pro is $20/mo.

---

## If You Launch to Real Users (Minimum Upgrades)

| Service | New Plan | New Cost | Why |
|---------|----------|----------|-----|
| Render Database | Basic | $6/mo | Persistent data — won't get deleted |
| Render Backend | Starter | $7/mo | No cold starts, better uptime |
| **New Total** | | **$142.00/mo** | +$13 from current |

---

## Current Total: $129/mo
## Launch-Ready Total: ~$142/mo
