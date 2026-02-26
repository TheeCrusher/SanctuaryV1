# Church Accounts — Future Features & Ideas

*Brainstormed Session 30 (2026-02-26). Build after v1 is complete.*

---

## v2: Church-Posted Events

**What:** Churches can post events directly from their church account (services, bible studies, youth nights, community outreach, mission trips, etc.)

**Key design points:**
- The `events` table already has a `church_id` column — use it. Add a `posted_by_church_account` INTEGER column to track which church account posted it.
- Church events should show up prioritized for members of that church (users who favorited it or set it as preferred church).
- Non-members can still discover church events through the existing local/regional/national scope filtering.
- Church-posted events should have a visual distinction from individual-posted events (badge, icon, or card style).
- Most real-world events will come from churches, not individuals. The events feed will be primarily church-driven content over time.
- Individual guides/seekers can still post their own events ("meeting at the park", digital sessions, etc.) — these coexist alongside church events.

---

## v3: Church Photo Uploads

**What:** Churches can upload a custom main photo and a gallery of additional photos (past events, facility shots, community gatherings).

**Key design points:**
- Custom main photo replaces the Google street-view default.
- Gallery photos appear on the ChurchDetail page in a scrollable section.
- Need a photo storage solution — recommend **Cloudinary** (free tier: 25GB storage, handles resizing/CDN).
- New table: `church_photos` (church_id, photo_url, caption, is_primary, uploaded_by, created_at).
- Google photo stays as ultimate fallback if no custom photo is uploaded.

---

## v4: Digital Tithing & Donations

**What:** Users can tithe to their church and donate to fundraising causes directly through the app.

**Key design points:**
- **Recurring tithing** — weekly/monthly giving to a user's church (replaces passing the plate or church website donate button).
- **Cause-based fundraising** — churches set up campaigns for specific needs (building fund, Boys & Girls Club, disaster relief, youth camp scholarships).
- **Payment processor** — Stripe is the most common. Research nonprofit rates and PCI compliance.
- **Fee structure** — probably don't take a cut of tithing (bad optics). Maybe a small platform fee for cause fundraising.
- **Tax receipts** — churches are 501(c)(3), donors expect deductible receipts. Decide who generates them.
- **Competition** — Tithe.ly, Pushpay, Givelify already exist. Sanctuary's advantage is integration into the broader spiritual community experience.
- **Build order:** Start with basic one-time giving, then add recurring, then cause-based campaigns.

---

## v5: Mission Work Discovery

**What:** Churches post mission trip opportunities. Users browse and sign up. Uses the local/regional/national/international scope system.

**Scope levels:**
- **Local** — community service (food bank, habitat builds, neighborhood cleanup)
- **Regional** — driving-distance trips (disaster relief, camp counseling)
- **National** — cross-country missions (reservation ministry, inner city outreach)
- **International** — overseas trips (village projects, medical missions, teaching, school building)

**Key design points:**
- Only church accounts can post mission opportunities.
- Each mission posting includes: title, description, location, dates, cost to participant, skills needed, age requirements, contact person, sign-up form, photos from past trips.
- **Discovery is the killer feature** — many seekers/guides never think about mission work because it doesn't cross their path. Browsing could spark interest they didn't know they had.
- **Credit fulfillment** — high school and college students need community service hours or mission credits. This helps them find opportunities.
- **Fundraising integration** — each mission trip can have its own fundraising goal (ties into the donations feature). "Help fund this trip" links to the giving system.
- Shows on the church's page AND in a global "Missions" discovery feed.

---

## v6: Church Study Regimens

**What:** A church can create recommended study plans that show up for their congregation members in the Scripture Study section.

**Key design points:**
- Pastor says "we're studying Romans this month" → it appears in every member's Scripture Study.
- Reuses the existing reading plans system (the `reading_plans` table already has `created_by`).
- New column on reading_plans: `church_account_id` — when set, the plan is a church recommendation.
- Members see a "Your Church Recommends" section at the top of Scripture Study.
- Church can create custom plans using the same custom plan builder that individual users already have.

---

## Other Ideas (No Timeline)

- **"Claim This Church" button** — on unclaimed church pages, show a CTA for the church to create an account.
- **Church responses to reviews** — like Google Business, the church can respond publicly to reviews (but not edit/delete them).
- **"Verified Church" badge** — a trust indicator (gold checkmark) on church pages that have been verified by Sanctuary.
- **Guide Verification badge** — on a guide's profile, show "Verified by Grace Church" if a church has vouched for them. Builds trust for seekers.
- **Church analytics dashboard** — page views, new members over time, review trends, event attendance.
- **Multi-admin roles** — future: instead of one shared password, support multiple logins with roles (admin, editor, viewer). Not needed until churches request it.
- **Church-to-church networking** — churches in the same area could coordinate events, share resources, co-host mission trips.
- **Denomination filtering** — let users browse churches by denomination (Baptist, Catholic, Methodist, etc.) in addition to location.

---

## Recommended Build Order

1. **v1** (current) — Church accounts, login, dashboard, profile editor, congregation view, guide verification
2. **v2** — Church-posted events (highest impact, churches are event machines)
3. **v3** — Photo uploads (visual polish, makes church pages look professional)
4. **v4** — Digital tithing & donations (complex, requires payment processor)
5. **v5** — Mission work discovery (builds on events + donations)
6. **v6** — Study regimens (builds on existing scripture system)
