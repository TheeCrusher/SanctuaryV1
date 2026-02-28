# Sanctuary App - Project Memory

## User Preferences
- **Beginner developer** - learning on the job while building this app
- **ALWAYS explain the reasoning** behind major steps — WHY you're doing something and WHERE you're doing it before making changes. Don't just write code silently. The user doesn't need every line of code explained (that would be overwhelming), but needs to understand the decision-making and approach.
- Prefers to understand the process, not just get results
- Using VS Code Codespaces (turbo trout) on an iPad
- GitHub user: TheeCrusher

## Project Overview
- **Sanctuary** is a spiritual guidance app connecting guides with seekers
- Originally built as a single HTML/CSS/JS file in Claude.ai
- Converted to **React.js** with Vite in this codespace
- Test credentials: test@sanctuary.com / Sanctuary123 (Pastor Mike, guide) + jordan@sanctuary.com / Sanctuary123 (Jordan Rivera, seeker) + church@sanctuary.com / Sanctuary123 (Willow Creek, church account)

## Tech Stack
- **Frontend**: React 18 + Vite 5, React Router v6, React Context, Plain CSS, Lucide React, socket.io-client
- **Backend**: Node.js + Express 5, PostgreSQL 16 (via Docker), JWT auth, bcryptjs, Socket.io, Resend (email)
- **Database**: PostgreSQL in Docker container (sanctuary-db)
- **Dev tools**: nodemon (auto-restart), morgan (request logging)
- **External APIs**: Google Places API (New) for church search & photos

## Frontend Architecture
- `src/components/common/` - Reusable: Avatar, Badge, Card, EmptyState, Modal, TappableName, UserActionMenu, OnboardingTour
- `src/components/layout/` - BottomNav (4 tabs: Home, Community, More, Profile)
- `src/components/screens/` - 34+ page components (includes ForgotPassword.jsx, FindGuides.jsx, MemorizationGame.jsx, ChurchDashboard.jsx, ChurchProfileEditor.jsx, ChurchCongregation.jsx, ChurchGuides.jsx). Notes.jsx still exists but is unused (merged into Appointments.jsx).
- `src/context/AppContext.jsx` - Global state (API + Socket.io)
- `src/context/ThemeContext.jsx` - Dark mode with localStorage
- `src/utils/api.js` - API helper with get/post/put/patch/delete + churchApi (separate token)
- `src/utils/socket.js` - Socket.io client connection helper
- `src/index.css` - All styles (42 sections)

## Backend Architecture
- `server/src/index.js` - Express + HTTP server + Socket.io (port 3001)
- `server/src/socket.js` - Socket.io: JWT auth, rooms, typing, online status
- `server/src/config/schema.sql` - 31 tables (added church_accounts, church_account_guides). Users table has `onboarding_completed` column. Churches has custom_description, custom_hours, custom_programs, managed_by.
- `server/src/routes/` - auth, church-auth, appointments, churches, conversations, users, quotes, notes, favorites, scripture, prayers, bible, community, home, events, blocks, notifications
- `server/src/middleware/churchAuth.js` - Church account JWT middleware (checks `type: 'church'`)
- `server/src/utils/createNotification.js` - Shared notification helper (INSERT + Socket.io emit)
- `server/src/utils/sendEmail.js` - Resend email utility (lazy init, password reset emails)
- `vite.config.js` - /api + /socket.io proxy to localhost:3001

## Database Tables (29)
- users (has phone_number, accepting_seekers, max_pending_requests), appointments, conversations, conversation_participants, messages
- churches (has google_place_id, custom_description, custom_hours, custom_programs, managed_by), bible_quotes, church_reviews, church_favorites, notes (has appointment_id FK)
- church_accounts (church_id, email, password_hash, display_name, status), church_account_guides (church_account_id, guide_id)
- scripture_verses, reading_plans (has created_by for custom plans), reading_plan_days, user_verse_bookmarks, user_reading_progress
- user_memorization_stats (user_id, verse_id, mode, attempts, correct_count, last_practiced)
- user_study_streaks (user_id, current_streak, longest_streak, last_study_date)
- prayer_requests (has type: prayer/testimony, linked_prayer_id), prayer_interactions
- user_bible_highlights, user_bible_bookmarks
- user_connections, user_blocks
- events (has event_type, event_link, is_live), event_rsvps, church_announcements, notifications
- password_resets (code_hash, method, expires_at, used, attempts, locked_until)
- guide_waitlist (guide_id, seeker_id, created_at, notified_at)

## How to Start
1. `docker compose up -d` (PostgreSQL)
2. `cd server && npm run seed` (26 tables + seed data)
3. `cd server && npm run dev` (Express + Socket.io on 3001)
4. `npm run dev` (Vite on 5173)

## Demo Seed Script
- **`npm run seed-demo`** — Populates DB with demo data (38 users, 15 events, 14 prayers/testimonies, 11 conversations, 42 connections, 51 verses) without dropping tables
- **For production**: `DATABASE_URL=<external_render_url> NODE_ENV=production npm run seed-demo`
- **Idempotent**: Checks if Sarah Johnson exists; skips if demo data already present
- **To re-seed**: Delete demo users first (`DELETE FROM users WHERE email LIKE '%@sanctuary.com' AND email NOT IN ('test@sanctuary.com', 'jordan@sanctuary.com')`) then re-run
- Demo data persists until manually cleaned — designed to make app look alive for demos
- Production was seeded with demo data on 2026-02-16

## Deployment (LIVE)
- **Frontend**: Vercel (https://sanctuary-v1.vercel.app)
  - Config: `vercel.json` in repo root
  - Env var: `VITE_API_URL` points to Render backend
- **Backend**: Render (https://sanctuary-api.onrender.com)
  - Service: `sanctuary-api` (Node, Free tier)
  - GitHub: TheeCrusher/SanctuaryV1, main branch
  - Env vars: CORS_ORIGIN, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, NODE_ENV, GOOGLE_PLACES_API_KEY, RESEND_API_KEY
- **Database**: Render PostgreSQL (sanctuary_db_9z5p)
- Health check: https://sanctuary-api.onrender.com/api/health

## Session History (compact)
- Sessions 2-3: Dark Mode, User Profiles, Church Reviews, Prayer Board, Recurring Appointments, Calendar View, Google Calendar Sync, Real-Time Messaging
- Session 4: Church logo on Sign In page
- Session 5: Bible Reader (KJV, book/chapter nav, highlights, bookmarks, search)
- Session 6: User Discovery & Messaging (TappableName, Invite Friends)
- Session 7: Sign Up (3-step onboarding), Community Feature (connections, role badges)
- Session 8: Merged Messages into Community (4-tab bottom nav)
- Session 9: Home Screen Redesign (Dashboard with 6 sections)
- Session 10: Safe User Discovery (church members, suggested users, profile privacy)
- Session 11: Events, Testimonies, Church Bulletin Board
- Session 12: Code Cleanup + Real Church Data (1,575 churches across 50 states)
- Session 13: Profile Photos (compression) + Block User system
- Session 14: Bidirectional Messaging Fix + User Action Menu
- Session 15: UI Tweaks & Church Fix (7 fixes across 7 files)
- Session 16: In-App Notification System (9 triggers, real-time via Socket.io)
- Session 17 (Phase 1): Google Places API Integration (search, photos, auto-save)
- Session 17 (Phase 2): Bug Fixes + Pastor Mike rename + Forgot Password feature
- Session 18: Resend API setup, Forgot Password UI fixes, church rating phase 3 DB columns
- Session 19: Appointments Rework (smart scheduling, role-aware confirm/decline, conflict detection)
- Session 20: UI Color Remaster (Gold + Burgundy accent system, 7 files, design polish)
- Session 21: Location-Based Churches (state/city on users, sign-up dropdown, AccountDetails edit mode, churches filtered by state, forgiving search parser)
- Session 22: Recommended Guides Discovery (Find a Guide screen, direct appointment requests, guide availability settings, waitlist system, waitlist_spot_open notification)
- Session 23: Bold UI Color Refresh (gold + burgundy accents across ALL screens, warm dark mode, color-coded icons)
- Session 24: Scripture Study Overhaul (layout reorganization, reading plan overhaul with custom/surprise plans, memorization game with 3 modes, 51 verses across 9 categories, streak tracking)
- Session 25: Location-Based Guide Search (scope pills: Local/Regional/National, state borders map) + Digital Events (In-Person/Digital tabs, live/recorded, LIVE NOW badge, Join/Watch buttons, 5 digital seed events)
- Session 26: Session Notes merged into Appointments (pill toggle, note-appointment linking, completion prompt, search, Notes.jsx standalone removed)
- Session 27: Onboarding Tour (role-aware first-time walkthrough, 8 seeker / 11 guide steps, spotlight + tooltip, skip confirmation, restart from Profile)
- Session 28: Production Deploy Fix (migrate.js missing column migrations for sessions 25-27 → indexes on nonexistent columns crashed Render build)
- Session 29: Production Bug Fixes + Demo Seed Script (fixed conversations.last_sender_id + reading_plans.created_by/created_at missing migrations, full API audit, created seed-demo.js for on-demand production data)
- Session 30: Church Accounts v1 (separate auth flow, church dashboard, profile editor, congregation view, verified guides management, login mode toggle)
- Session 31: UI Polish — Batch 1: Church Accounts (fixed critical `API_BASE` bug in ChurchDashboard, added error states + toasts to all 4 church screens, search loading indicator in ChurchGuides, replaced inline styles with CSS classes). Batch 2: General empty/loading state standardization (BlockedUsersScreen, Chat, Scripture Browse Verses).

## NEXT SESSION IDEAS
- **Church DB Backfill** — Run `backfill-churches.js` script to add google_place_id + real addresses to all 1,580 churches (~$50 against $200 free credit). Prompt saved in Session 30 chat.
- **Guide Ratings & Reviews** — Allow seekers to rate and review guides after completed sessions
- **Appointment Reminders** — Push notifications or email reminders before upcoming sessions
- **Guide Dashboard** — Analytics for guides (sessions completed, seeker retention, avg ratings)

## Topic Files (read when working on specific areas)
- **`session-details.md`** — Detailed implementation notes for Sessions 7, 11, 13, 16, 17-20
- **`google-places.md`** — Google Places API endpoints, church system architecture, photo proxy pattern, costs
- **`production-debugging.md`** — Session 29 migration audit, how to test production API endpoints
- **`costs.md`** — All service costs, plans, upgrade triggers ($129/mo total)
- **`church-accounts-design.md`** — Full blueprint for Church Accounts feature (brainstormed Session 30)
- **`monetization-missions-design.md`** — Digital tithing, donations, and mission work discovery (brainstormed Session 30)

## Key Patterns
- **Accent color system (Session 20)**: Gold for guides/ratings/prestige, Burgundy for prayer/hearts/devotion. Use `var(--accent-gold)` and `var(--accent-burgundy)` — NOT hardcoded hex values.
- CSS vars for theming: `var(--bg-primary)`, `[data-theme="dark"]`
- Edit tool requires re-reading file if context was compacted
- Bottom Nav: Home | Community | More | Profile
- More Menu order: **Find a Guide**, Events, Churches, Bibles, Prayer Board, Scripture Study, Sessions
- **Routes**: `/profile` = own profile (Profile.jsx), `/user/:id` = other user (UserProfile.jsx)
- **ChurchDetail fetches from API** — `GET /api/churches/:id` (NOT from `allChurches` cache)
- **RSVP is automatic** — No organizer approval needed
- **Unauthenticated routes go BEFORE `router.use(authenticate)`** — used for photo proxy in churches.js
- **API_BASE pattern**: `import.meta.env.VITE_API_URL || ''` — empty in dev (Vite proxy), full URL in production
- **Users table has state/city**: `state VARCHAR(2)`, `city VARCHAR(100)`, `preferred_church_id INTEGER` — added Session 21
- **Churches state format mismatch**: Seeded churches use full names ("Illinois"), Google-saved use abbreviations ("IL"). Backend `stateMap.js` handles both.
- **loadAllData(userObj)** takes a user object parameter — used to pass location to churches API call
- **AccountDetails.jsx** has view/edit toggle — editable fields: name, phone, state, city, denomination, churchName
- **Constants file**: `src/utils/constants.js` has US_STATES array + `getStateName()`. Backend: `server/src/utils/stateMap.js`
- **Schema FK ordering**: users table has `preferred_church_id` but churches table is defined later. FK added via deferred `ALTER TABLE` at end of schema.sql
- **Forgiving search**: `parseSearchQuery()` in churches.js splits "City State" patterns (comma or space separated, abbreviation or full name). Falls through to single-term ILIKE search for church names/zip.
- **Default church list pagination**: Shows 10 at a time with "Show 10 More" button (same as Google search results)
- **CSS warm variables**: `--border-warm`, `--bg-warm-tint` for gold-tinted borders/backgrounds
- **More Menu icon classes**: `icon-gold` and `icon-burgundy` on `.more-menu-item-icon` for color-coded icons
- **Profile role classes**: `.profile-header-guide` (gold tint header), `.profile-avatar-guide` / `.profile-avatar-seeker` (ring colors)
- **Appointment card status**: `.apt-status-confirmed`, `.apt-status-pending`, `.apt-status-completed` on Card for gold/burgundy left borders
- **Prayer testimony class**: `.testimony-card` on `.prayer-card` for gold left border (vs burgundy default)
- **Seeker badges**: Now blue (`--bg-accent` / `--brand-light-text`) instead of green
- **Guide availability**: `users.accepting_seekers` (boolean) + `users.max_pending_requests` (int 1-20). Profile.jsx shows guide settings when `user.role === 'guide'`
- **Guide discovery**: `GET /api/users/guides?scope=&state=&city=&churchId=&q=` returns guides filtered by location scope. Sorted: accepting first, then available slots, then name. Excludes blocked users.
- **Guide scope filtering**: `scope=local` (same state, sub-sorted: same church > same city > rest), `scope=regional` (bordering states from `stateBorders.js`), `scope=national` (all others). No scope = all guides.
- **State borders utility**: `server/src/utils/stateBorders.js` — maps each US state abbreviation to its bordering state abbreviations. AK/HI have empty arrays.
- **Waitlist system**: `guide_waitlist` table tracks seekers waiting for a spot. `checkWaitlistSpot()` in appointments.js auto-notifies oldest seeker when a spot opens (confirm/decline triggers).
- **Direct booking**: Seekers can request sessions with ANY guide (not just connections). UserProfile passes `?guideId=X&guideName=Y` to Appointments via URL search params.
- **Appointments seeker dropdown**: Now uses `GET /api/users/guides` (all guides) instead of community connections
- **Scripture categories**: 9 total — Love, Strength, Hope, Comfort, Trust, Courage, Faith, Peace, Gratitude (51 verses)
- **Reading plans `created_by`**: NULL = system preset (3 originals), user ID = custom plan. `GET /plans` returns both with inline progress data.
- **Custom plans**: POST `/scripture/plans/custom` (name, category, duration) and POST `/scripture/plans/surprise` (duration). DELETE `/scripture/plans/:id` only works for custom plans.
- **Memorization game routes**: `/scripture/game/:mode` where mode = fill_blank | scramble | flashcard. Component: MemorizationGame.jsx
- **Game logic is client-side**: Word shuffling, blank creation, answer checking all in browser. Backend only stores stats via POST `/scripture/memorization/record`
- **Study streaks**: `user_study_streaks` table with current_streak, longest_streak, last_study_date. Updated on each game round (consecutive days = streak increment, gap = reset to 1)
- **STOP_WORDS**: Defined in MemorizationGame.jsx for Fill in the Blank mode — skips common words when choosing blanks
- **Events table new columns**: `event_type` (in_person/digital), `event_link` (URL), `is_live` (boolean). Category CHECK expanded to include Sermons/Teachings, Prayer, Bible Study, General.
- **Digital event status**: Computed server-side via `computeEventStatus()` — returns `live_now` (within 2hr of start), `upcoming`, `recorded`, or `past`. Recorded events always shown (no time filter).
- **Events type tabs**: EventsScreen has In-Person/Digital segmented toggle. Each tab has its own category sub-tabs. Digital categories: All, Sermons/Teachings, Prayer, Worship, Bible Study, General.
- **Digital event cards**: Burgundy left border (`.event-card-digital`), Video icon, platform name via `getPlatformName(url)`, Join/Watch button (burgundy), LIVE badge with pulsing dot.
- **Create event form**: Type toggle (In-Person/Digital), conditional fields (location vs link+Live/Recorded toggle), category dropdown switches based on type.
- **GET /api/events**: Accepts `event_type` param (in_person/digital). In-person = future only. Digital = recorded always + live within 2hr window.
- **Session Notes merged into Appointments**: Pill toggle `[Sessions] [Session Notes]` at top of Appointments screen. Notes.jsx standalone removed. `/notes` redirects to `/appointments`.
- **Notes table has `appointment_id`**: Nullable FK to appointments. Notes can be standalone or linked to a completed session.
- **Completion prompt**: When guide marks session complete, modal asks "Would you like to add notes?" → opens note editor pre-linked to that appointment.
- **`has_notes` on appointments**: `GET /api/appointments` includes `has_notes` boolean via EXISTS subquery. Completed cards show FileText icon if notes exist.
- **Notes GET query COALESCE**: Falls back to `a.seeker_name` when `seeker_id` is null (for old free-text appointments).
- **Onboarding Tour**: `OnboardingTour.jsx` in common, triggered from App.jsx when `user.onboardingCompleted === false` on `/dashboard`. Uses `data-tour-id` attributes on BottomNav, MoreMenu, EventsScreen for spotlight targeting. Box-shadow spotlight technique. Role-aware steps (8 seeker / 11 guide). Restart via Profile.jsx → sets `onboardingCompleted: false` → navigates to `/dashboard`.
- **`data-tour-id` attributes**: Added to BottomNav buttons (`nav-home`, `nav-community`, `nav-events`, `nav-more`, `nav-profile`), MoreMenu items (`more-find-guide`, `more-prayer-board`, `more-sessions`), EventsScreen create button (`events-create`).
- **`users.onboarding_completed`**: BOOLEAN DEFAULT false. Set to true on tour completion/skip. Test users seeded as true. Returned via login, register, GET/PUT /me.
- **CRITICAL — migrate.js rule**: When adding columns to existing tables in `schema.sql`, ALWAYS also add matching `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` to the `columnMigrations` array in `server/src/seeds/migrate.js`. Without this, production deploys crash because `CREATE TABLE IF NOT EXISTS` skips existing tables and `CREATE INDEX` fails on missing columns.
- **Church Accounts (Session 30)**: Separate auth system from user accounts. `church_accounts` table has status (pending/active/suspended). JWT tokens include `type: 'church'`. `authenticateChurch` middleware in `server/src/middleware/churchAuth.js`. Frontend uses separate `churchApi` + `sanctuary_church_token` in localStorage. Church routes: `/church-dashboard`, `/church-profile-editor`, `/church-congregation`, `/church-guides` — all wrapped in `ChurchProtectedRoute`. Login page has User/Church toggle. Church accounts don't get bottom nav. `managed_by` on churches table links to `church_accounts.id`.
- **Church account endpoints**: POST `/church-auth/register`, POST `/church-auth/login`, GET `/church-auth/me`, PUT `/church-auth/profile`, GET `/church-auth/congregation`, POST `/church-auth/verify-guide`, DELETE `/church-auth/verify-guide/:id`, GET `/church-auth/search-guides?q=`
- **Church screen error/loading CSS classes (Session 31)**: `.church-screen-center` centers the loading spinner (replaces inline `style={{ display:'flex'... }}`). `.church-editor-error` is a red toast (mirrors `.church-editor-success`). Both in index.css after the church styles block.
- **Church screen error state pattern (Session 31)**: Load failures use `error` state + render `.church-empty-state` with `AlertCircle` icon. Save/action failures (ProfileEditor, Guides) use `error`/`actionError` state + `.church-editor-error` toast inline near the button. `ChurchGuides` has separate `loadError` (full screen) and `actionError` (inline toast) states.
- **PrayerBoard is best-in-class**: Already uses `LoadingSpinner`, `EmptyState`, and `ErrorState` from `../common` — use it as a reference pattern.
- **EmptyState component usage**: `icon` accepts a Lucide component (e.g. `icon={ShieldOff}`) or emoji string. Always prefer `<EmptyState>` over hand-rolled inline divs with `style={{ textAlign:'center', ... }}`.

---
## File Structure

### Frontend Screens (src/components/screens/)
About.jsx
AccountDetails.jsx
Appointments.css
Appointments.jsx
BibleReader.css
BibleReader.jsx
BibleSelect.css
BibleSelect.jsx
BlockedUsersScreen.css
BlockedUsersScreen.jsx
CalendarView.jsx
Chat.jsx
ChurchCongregation.jsx
ChurchDashboard.css
ChurchDashboard.jsx
ChurchDetail.jsx
ChurchGuides.jsx
ChurchProfileEditor.jsx
Churches.css
Churches.jsx
Community.css
CommunityScreen.jsx
Contact.jsx
Dashboard.css
Dashboard.jsx
EventDetail.jsx
EventsScreen.css
EventsScreen.jsx
FindGuides.css
FindGuides.jsx
ForgotPassword.css
ForgotPassword.jsx
Help.jsx
LoginScreen.css
LoginScreen.jsx
MemorizationGame.css
MemorizationGame.jsx
MoreMenu.jsx
Notifications.css
Notifications.jsx
PaymentMethod.jsx
PrayerBoard.css
PrayerBoard.jsx
Privacy.jsx
Profile.css
Profile.jsx
ReadingPlan.jsx
Scripture.css
Scripture.jsx
SignUpScreen.css
SignUpScreen.jsx
SplashScreen.css
SplashScreen.jsx
Terms.jsx
UserProfile.jsx
WalkOnWater.jsx
index.js

### Backend Routes (server/src/routes/)
appointments.js
auth.js
bible.js
blocks.js
church-auth.js
churches.js
community.js
conversations.js
events.js
favorites.js
home.js
notes.js
notifications.js
prayers.js
quotes.js
scripture.js
users.js

### Common Components (src/components/common/)
Avatar.css
Avatar.jsx
Badge.jsx
Card.css
Card.jsx
EmptyState.css
EmptyState.jsx
ErrorState.jsx
IOSInstallPrompt.jsx
LoadingSpinner.jsx
Modal.css
Modal.jsx
OnboardingTour.css
OnboardingTour.jsx
TappableName.jsx
Toast.jsx
UserActionMenu.css
UserActionMenu.jsx
index.js
