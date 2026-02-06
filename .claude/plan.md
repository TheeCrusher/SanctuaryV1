# Sanctuary App — 8 New Features Implementation Plan

## Overview

We're adding 8 features in **3 phases**, so you can test each phase before moving on.
Two features (Video/Audio Calls, Push Notifications) are saved for later.

---

## PHASE 1 — Quick Wins (UI + Simple Backend)
*Estimated: 4 features, can test immediately after each one*

### Feature 1: Dark Mode
**What it does:** Adds a toggle (in Profile or More menu) to switch the entire app between light and dark themes.

**Why first:** No backend changes needed. Pure CSS + a small React context. Great way to warm up.

**Changes:**
- **New file: `src/context/ThemeContext.jsx`**
  - Creates a ThemeProvider that wraps the app
  - Stores theme preference in localStorage (`'light'` or `'dark'`)
  - Toggles a `data-theme="dark"` attribute on `<html>` element
  - Exposes `theme` and `toggleTheme()` via `useTheme()` hook

- **Edit: `src/index.css`**
  - Add CSS custom properties (variables) at the top: `--bg-primary`, `--text-primary`, `--card-bg`, etc.
  - Define light theme values as defaults under `:root`
  - Define dark theme values under `[data-theme="dark"]`
  - Replace hardcoded colors throughout the CSS with these variables
  - This is the biggest part — systematically updating existing color values

- **Edit: `src/main.jsx`**
  - Wrap `<App />` with `<ThemeProvider>`

- **Edit: `src/components/screens/Profile.jsx`**
  - Add a dark mode toggle switch in the Account section (between menu items)
  - Uses `useTheme()` to read and toggle theme

---

### Feature 2: User Profiles with Bios & Photos
**What it does:** Expands the Profile screen so users can add a bio, their role/specialization, and view their profile in a more detailed way. Other users can also see profiles.

**Changes:**
- **Edit: `server/src/config/schema.sql`**
  - Add columns to `users` table: `bio TEXT`, `specialization TEXT`, `location TEXT`

- **Edit: `server/src/routes/users.js`**
  - Update `PUT /api/users/me` to accept bio, specialization, location
  - Add `GET /api/users/:id` — view another user's public profile

- **Edit: `server/src/seeds/seed.js`**
  - Add bio/specialization/location to seed users

- **Edit: `src/context/AppContext.jsx`**
  - Add `updateProfile(data)` function that PUTs to `/api/users/me`
  - Update user state after successful save

- **Edit: `src/components/screens/Profile.jsx`**
  - Add editable bio field (textarea, max 200 chars)
  - Add specialization dropdown (Bible Study, Prayer, Counseling, Youth Ministry, etc.)
  - Add location text field
  - "Save" button that calls `updateProfile()`
  - Display these fields in the profile header area

- **New file: `src/components/screens/UserProfile.jsx`**
  - Public profile view (when viewing someone else)
  - Shows name, photo, bio, specialization, location
  - "Message" button to start conversation

- **Edit: `src/App.jsx`**
  - Add route `/user/:id` → UserProfile

---

### Feature 3: Ratings & Reviews
**What it does:** Users can leave star ratings + text reviews on churches. Shows average ratings and individual reviews on church detail pages.

**Changes:**
- **Edit: `server/src/config/schema.sql`**
  - New table: `church_reviews` (id, user_id, church_id, rating 1-5, review_text, created_at)
  - UNIQUE constraint on (user_id, church_id) — one review per user per church
  - Index on church_id for fast lookups

- **New file: `server/src/routes/reviews.js`**
  - `GET /api/churches/:id/reviews` — list reviews for a church (joins user name/photo)
  - `POST /api/churches/:id/reviews` — submit review (rating required, text optional)
  - `PUT /api/churches/:id/reviews` — update own review
  - `DELETE /api/churches/:id/reviews` — delete own review
  - After each write, recalculate `overall_rating` and `review_count` in churches table

- **Edit: `server/src/index.js`**
  - Register reviewRoutes

- **Edit: `server/src/seeds/seed.js`**
  - Add sample reviews from seed users

- **Edit: `src/context/AppContext.jsx`**
  - Add `getChurchReviews(churchId)` function
  - Add `submitReview(churchId, rating, text)` function
  - Add `deleteReview(churchId)` function

- **Edit: `src/components/screens/ChurchDetail.jsx`**
  - Add "Reviews" section below existing ratings
  - Show list of reviews (user avatar, name, stars, text, date)
  - "Write a Review" button opens modal with star selector + textarea
  - If user already reviewed, show "Edit" and "Delete" options

- **Edit: `src/index.css`**
  - Add review card styles, star rating selector (clickable stars)

---

### Feature 4: Prayer Request Board
**What it does:** A community board where users can post prayer requests, and others can "pray" (like a supportive reaction) or comment.

**Changes:**
- **Edit: `server/src/config/schema.sql`**
  - New table: `prayer_requests` (id, user_id, title, description, category, is_anonymous BOOLEAN, prayer_count INTEGER DEFAULT 0, status TEXT DEFAULT 'active', created_at, updated_at)
  - New table: `prayer_interactions` (id, user_id, request_id, type TEXT 'prayed'/'comment', comment_text, created_at)
  - Categories: 'Health', 'Family', 'Guidance', 'Gratitude', 'Financial', 'Other'
  - Indexes on request_id, user_id, status

- **New file: `server/src/routes/prayers.js`**
  - `GET /api/prayers` — list active requests (with prayer count, comment count, user info)
  - `GET /api/prayers?category=Health` — filter by category
  - `POST /api/prayers` — create new request
  - `POST /api/prayers/:id/pray` — increment prayer count (one per user via interactions table)
  - `GET /api/prayers/:id/comments` — get comments for a request
  - `POST /api/prayers/:id/comments` — add comment
  - `PATCH /api/prayers/:id` — mark as answered/close (owner only)
  - `DELETE /api/prayers/:id` — delete own request

- **Edit: `server/src/index.js`**
  - Register prayerRoutes

- **Edit: `src/context/AppContext.jsx`**
  - Add `prayerRequests` state array
  - Add `prayerCategories` constant
  - Functions: `fetchPrayers()`, `createPrayer()`, `prayForRequest()`, `addPrayerComment()`, `closePrayerRequest()`
  - Add prayers fetch to `loadAllData()`

- **New file: `src/components/screens/PrayerBoard.jsx`**
  - List of prayer request cards with:
    - User avatar + name (or "Anonymous")
    - Title + description preview
    - Category badge
    - Prayer count with hands-praying icon (click to pray)
    - Comment count
    - Time ago
  - Category filter pills at top
  - "New Request" FAB/button → modal with form
  - Click card → expanded view with full description + comments
  - "Answered" badge for resolved prayers

- **Edit: `src/components/screens/MoreMenu.jsx`**
  - Add "Prayer Board" menu item (Heart/HandsPraying icon → /prayers)

- **Edit: `src/App.jsx`**
  - Add route `/prayers` → PrayerBoard

- **Edit: `src/components/layout/BottomNav.jsx`**
  - Add `/prayers` to `isMoreActive()` check

- **Edit: `src/index.css`**
  - Prayer board styles (cards, pray button animation, comment section)

---

## PHASE 2 — Scheduling Enhancements
*Builds on existing appointments system*

### Feature 5: Recurring Appointments
**What it does:** When creating an appointment, users can set it to repeat (weekly, biweekly, monthly). The system generates future appointment instances automatically.

**Changes:**
- **Edit: `server/src/config/schema.sql`**
  - Add columns to `appointments` table:
    - `recurrence_rule TEXT` (null = one-time, 'weekly', 'biweekly', 'monthly')
    - `recurrence_end_date DATE` (when to stop recurring)
    - `parent_appointment_id INTEGER` (links generated instances to the original)

- **Edit: `server/src/routes/appointments.js`**
  - Update `POST /` to accept recurrence_rule and recurrence_end_date
  - When recurrence is set, generate future appointments (up to 12 weeks out)
  - Each generated appointment gets parent_appointment_id set to the original
  - Add `DELETE /:id` endpoint with options: "this one only" or "this and all future"
  - Update `GET /` to include recurrence info in response

- **Edit: `src/components/screens/Appointments.jsx`**
  - Add "Repeat" dropdown to create form (None, Weekly, Biweekly, Monthly)
  - When repeat is chosen, show end date picker
  - Show recurring icon on appointment cards that are recurring
  - Delete options: "This appointment" vs "All future appointments"

- **Edit: `src/context/AppContext.jsx`**
  - Update `createAppointment()` to pass recurrence data
  - Add `deleteAppointment(id, deleteAll)` function

- **Edit: `src/index.css`**
  - Recurring badge/icon styles

---

### Feature 6: Calendar View
**What it does:** A visual monthly calendar showing appointments as colored dots/events. Tap a day to see that day's appointments.

**Changes:**
- **New file: `src/components/screens/CalendarView.jsx`**
  - Monthly calendar grid (7 columns x 5-6 rows)
  - Navigation arrows to change month
  - Colored dots on days with appointments (color by status)
  - Tap a day → shows list of that day's appointments below calendar
  - Toggle button to switch between calendar view and list view (existing Appointments screen)
  - Today highlighted with special styling

- **Edit: `src/components/screens/Appointments.jsx`**
  - Add view toggle button (List | Calendar) at top
  - When "Calendar" selected, show CalendarView component
  - Share the same appointments data

- **Edit: `src/index.css`**
  - Calendar grid styles, day cells, dots, selected/today highlights

---

### Feature 7: Google Calendar Sync
**What it does:** Users can export appointments to Google Calendar or import from it. Adds an "Add to Google Calendar" button on each appointment.

**Changes:**
- **Edit: `src/components/screens/Appointments.jsx`**
  - Add "Add to Google Calendar" button on each appointment card
  - Button generates a Google Calendar URL with pre-filled event details
  - Opens in new tab (uses Google Calendar's URL scheme — no API key needed!)
  - Format: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=...&details=...`

- **Edit: `src/components/screens/CalendarView.jsx`**
  - Add "Export Month" button that generates .ics file for the month
  - .ics files can be imported into ANY calendar app (Google, Apple, Outlook)

- **New utility: `src/utils/calendar.js`**
  - `generateGoogleCalendarUrl(appointment)` — builds the Google Calendar URL
  - `generateICSFile(appointments)` — creates .ics file content
  - `downloadICS(appointments, filename)` — triggers file download

- **Edit: `src/index.css`**
  - Google Calendar button styles, export button

**Note:** This approach uses Google Calendar's URL scheme and .ics file format — both are FREE and don't require any API keys or Google accounts on our end. The user just needs to be logged into their Google account in their browser.

---

## PHASE 3 — Real-Time & Community
*Biggest changes — adds Socket.io for live features*

### Feature 8: Real-Time Messaging + Group Conversations
**What it does:** Messages update instantly (no page refresh needed) using Socket.io. Also adds group conversation support where multiple people can chat together.

**Changes (Backend):**
- **Install: `socket.io` package in server**

- **Edit: `server/src/index.js`**
  - Create HTTP server from Express app
  - Attach Socket.io to HTTP server
  - Socket authentication middleware (verify JWT on connection)
  - Socket events: `join-room`, `send-message`, `typing`, `stop-typing`
  - Emit events: `new-message`, `user-typing`, `user-stopped-typing`

- **Edit: `server/src/config/schema.sql`**
  - New table: `conversation_members` (id, conversation_id, user_id, joined_at)
  - Add column to `conversations`: `is_group BOOLEAN DEFAULT false`, `group_name TEXT`
  - This allows many-to-many: multiple users in one conversation

- **Edit: `server/src/routes/conversations.js`**
  - Update `POST /` to accept `memberIds` array for group creation
  - Update `GET /` to return group conversations with member list
  - Add `POST /:id/members` — add member to group
  - Add `DELETE /:id/members/:userId` — remove member (owner only)
  - Update message queries to work with group conversations

- **Edit: `server/src/seeds/seed.js`**
  - Add conversation_members entries for existing seed conversations

**Changes (Frontend):**
- **Install: `socket.io-client` package**

- **New file: `src/context/SocketContext.jsx`**
  - Connects to Socket.io server on login
  - Disconnects on logout
  - Provides `socket` instance via `useSocket()` hook
  - Handles reconnection automatically

- **Edit: `src/main.jsx`**
  - Wrap app with `<SocketProvider>`

- **Edit: `src/context/AppContext.jsx`**
  - Messages: listen for `new-message` socket event → update conversation in real time
  - Update unread counts when message arrives for non-selected conversation

- **Edit: `src/components/screens/Messages.jsx`**
  - Add "New Group" button
  - Group creation modal: select multiple people, set group name
  - Group conversations show group name + member count
  - Group avatar shows stacked member avatars

- **Edit: `src/components/screens/Chat.jsx`** (or MessageThread)
  - Send messages via socket (emit `send-message`) instead of REST POST
  - Listen for `new-message` to show incoming messages instantly
  - Typing indicator: emit `typing` when user types, show "User is typing..." for others
  - Group chat: show sender name + avatar above each message
  - "Members" button in header → shows member list

- **Edit: `src/index.css`**
  - Typing indicator animation (three bouncing dots)
  - Group avatar styles (overlapping circles)
  - Member list styles

---

## Summary Table

| Phase | Feature | New Files | Backend Changes | Complexity |
|-------|---------|-----------|-----------------|------------|
| **1** | Dark Mode | ThemeContext.jsx | None | Medium (CSS work) |
| **1** | User Profiles | UserProfile.jsx | users table + routes | Low-Medium |
| **1** | Ratings & Reviews | reviews.js route | reviews table | Medium |
| **1** | Prayer Board | PrayerBoard.jsx, prayers.js | 2 new tables | Medium |
| **2** | Recurring Appointments | — | appointments columns | Medium |
| **2** | Calendar View | CalendarView.jsx | None | Medium |
| **2** | Google Calendar Sync | calendar.js utility | None | Low |
| **3** | Real-Time + Groups | SocketContext.jsx | Socket.io + tables | High |

---

## Build Order Within Each Phase

**Phase 1:** Dark Mode → User Profiles → Ratings & Reviews → Prayer Board
**Phase 2:** Recurring Appointments → Calendar View → Google Calendar Sync
**Phase 3:** Real-Time Messaging + Group Conversations (single combined feature)

After each phase, we'll:
1. Test all new features
2. Commit to git
3. Make sure nothing is broken before moving on

---

## What's Saved for Later
- **Video/Audio Calls** — Needs Twilio/Agora (paid service)
- **Push Notifications** — Needs Firebase setup (tricky on iPad)
