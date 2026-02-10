# Sanctuary App — Session 13 Implementation Plan

## Overview

4 phases focused on **profile photos**, **safety** (block/report), and **trust** (guide verification).
3 new database tables, ~25 existing files modified, 8 new files created.

---

## PHASE 1 — Profile Photos Enhancement

**What:** Compress images client-side before upload, fix missing photo_url in messaging APIs, add initials-based default avatar, add optional photo upload during signup.

### New Files
- `src/utils/imageCompress.js` — Reusable canvas-based compression (max 300x300, JPEG 0.8 quality, ~30-50KB output)

### Modified Files
- `Avatar.jsx` — Add `name` prop for initials fallback (colored circle with first+last initials when no photo/emoji)
- `Profile.jsx` — Use `compressImage()` instead of raw FileReader
- `SignUpScreen.jsx` — Add optional photo upload in Step 2
- `conversations.js` (server) — Add `u.photo_url` to SELECT queries, add `photoUrl` to responses
- `users.js` (server) — Add `photo_url` to GET /available
- `Chat.jsx` — Add `src={selectedConversation.photoUrl}` to header Avatar
- `CommunityScreen.jsx` — Add `src={conv.photoUrl}` to messages tab and new-conversation modal

---

## PHASE 2 — Block a User

**What:** Block from profile page (3-dot menu). Blocked users invisible to each other across entire app. All checks server-side in SQL.

### New Files
- `server/src/routes/blocks.js` — POST/DELETE/GET endpoints
- `BlockedUsersScreen.jsx` — Manage blocks

### Modified Files
- `schema.sql` — New `user_blocks` table
- `seed.js`, `migrate.js` — Support new table
- `server/src/index.js` — Mount routes
- Block filtering in 7 route files: `community.js`, `conversations.js`, `prayers.js`, `users.js`, `events.js`, `churches.js`, `home.js`
- `UserProfile.jsx` — 3-dot menu with "Block User"
- `Profile.jsx` — "Blocked Users" in Account section
- `App.jsx` — Add `/blocked-users` route

### Block SQL Pattern
```sql
AND u.id NOT IN (
  SELECT blocked_id FROM user_blocks WHERE blocker_id = $USER
  UNION
  SELECT blocker_id FROM user_blocks WHERE blocked_id = $USER
)
```

---

## PHASE 3 — Report Content

**What:** Report prayers, reviews, events, messages, profiles. Auto-hides from reporter. 3+ reports from different users auto-hides from everyone.

### New Files
- `server/src/routes/reports.js` — POST /api/reports, GET /api/reports/my, GET /api/reports (admin)
- `ReportModal.jsx` — Reusable modal with reason dropdown + details

### Modified Files
- `schema.sql` — New `reports` table
- `seed.js` — Support new table
- `server/src/index.js` — Mount routes
- `AppContext.jsx` — Add `reportedItems` state, `reportContent()`, `isReported()`
- `UserProfile.jsx` — "Report User" in 3-dot menu
- `PrayerBoard.jsx` — Report option on prayer cards
- `prayers.js`, `churches.js`, `events.js` — Auto-hide filter (3+ reports)

---

## PHASE 4 — Guide Verification

**What:** Guides request verification (church, title, ministry info). Admin approves. Blue checkmark badge appears everywhere name shows. Seekers can filter by verified.

### New Files
- `server/src/routes/verification.js` — Request, status, approve/deny, list pending
- `VerifiedBadge.jsx` — Blue checkmark (Lucide CheckCircle)
- `VerificationScreen.jsx` — Request form + status display

### Modified Files
- `schema.sql` — `is_verified` column on users, new `guide_verifications` table
- `migrate.js` — ALTER TABLE for `is_verified`
- `seed.js` — Set test guide as verified
- Add `isVerified` to ALL user responses (9 route files): `auth.js`, `users.js`, `community.js`, `conversations.js`, `prayers.js`, `events.js`, `churches.js`, `home.js`
- `TappableName.jsx` — Add `isVerified` prop, render badge inline
- `UserProfile.jsx` — Show badge + "Verified Guide" label
- `Profile.jsx` — "Get Verified" button for unverified guides
- `CommunityScreen.jsx` — Verified filter, badge on cards
- `App.jsx` — Add `/verification` route

---

## Database Summary

| Table | Purpose |
|-------|---------|
| `user_blocks` (NEW) | Block relationships |
| `reports` (NEW) | Content moderation |
| `guide_verifications` (NEW) | Verification requests |
| `users` (MODIFIED) | +`is_verified` column |

**Total tables: 23 → 26**

## File Count
- 8 new files created
- ~25 existing files modified

## Testing
After each phase: `npm run seed` → restart backend → test in browser on port 5173
