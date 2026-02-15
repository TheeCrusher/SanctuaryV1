# Sanctuary Cleanup Log

A running record of cleanup and maintenance work. Each entry documents what was changed, why, and which files were affected — so if something breaks, you can trace it back.

---

## Session 26 — February 14, 2026

**Focus:** Code cleanup and tightening (no new features)

### 1. Removed unused imports in Dashboard.jsx
- **What:** `Star`, `BookOpen`, and `Clock` icons were imported from lucide-react but never used.
- **Fix:** Removed from the import statement.
- **Why:** Dead imports add confusion and slightly bloat the bundle.
- **File:** `src/components/screens/Dashboard.jsx`

### 2. Fixed hardcoded "4.9" rating in Dashboard.jsx
- **What:** The "Your Sessions" stats grid showed a hardcoded `4.9` rating not connected to any real data.
- **Fix:** Changed to `—` (em dash) as a placeholder until a real guide ratings feature exists.
- **Why:** Showing fake data is misleading. A dash makes it clear the feature isn't live yet.
- **File:** `src/components/screens/Dashboard.jsx`

### 3. Removed unused context variables in AppContext.jsx
- **What:** Three state values were computed/stored but no component ever read them:
  - `churchSearchTotal` — set but never displayed
  - `churchSearchHasMore` — always set to `false`, never checked
  - `uniqueSeekersCount` — computed from appointments but never shown
  - Also: `useCallback` was imported but never used.
- **Fix:** Removed all three variables, their state/setters, and their exports. Removed `useCallback` import.
- **Why:** Dead state adds cognitive overhead and makes the context API harder to understand.
- **File:** `src/context/AppContext.jsx`

### 4. Extracted duplicate `getPlatformName()` to shared utility
- **What:** Identical 10-line function copy-pasted in both `EventsScreen.jsx` and `EventDetail.jsx`.
- **Fix:** Moved to new `src/utils/helpers.js`, both files now import it.
- **Why:** DRY — if a new platform is added (e.g., "Google Meet"), it's changed in one place.
- **Files:** `src/utils/helpers.js` (new), `src/components/screens/EventsScreen.jsx`, `src/components/screens/EventDetail.jsx`

### 5. Extracted duplicate `formatDate()` / `formatTime()` to shared utility
- **What:** `formatDate()` was defined identically in 3 files (Dashboard, EventsScreen, Appointments). `formatTime()` was identical in 2 files (EventsScreen, EventDetail). EventDetail used a different "long" date format.
- **Fix:** Created two shared functions: `formatDateShort()` (cards/lists) and `formatDateLong()` (detail screens), plus shared `formatTime()`. All 4 components now import from helpers.
- **Why:** One place to update if date display format ever needs to change.
- **Files:** `src/utils/helpers.js`, `src/components/screens/Dashboard.jsx`, `src/components/screens/EventsScreen.jsx`, `src/components/screens/EventDetail.jsx`, `src/components/screens/Appointments.jsx`

### 6. Fixed duplicate `API_BASE` definitions
- **What:** `Churches.jsx` re-defined `const API_BASE = import.meta.env.VITE_API_URL || ''` locally, and `ChurchDetail.jsx` had it inline. Both duplicated what already existed in `api.js`.
- **Fix:** Exported `API_BASE` from `src/utils/api.js`, both components now import it.
- **Why:** Single source of truth — if the env var name ever changes, one file to update.
- **Files:** `src/utils/api.js`, `src/components/screens/Churches.jsx`, `src/components/screens/ChurchDetail.jsx`

### 7. Added password validation to register route
- **What:** The reset-password route required 8+ character passwords, but the register route had no length check at all.
- **Fix:** Added `password.length < 8` validation to the register route, matching the reset-password rule.
- **Why:** Security consistency — both paths should enforce the same minimum.
- **File:** `server/src/routes/auth.js`

### All files changed this session
| File | Action |
|------|--------|
| `src/utils/helpers.js` | Created (shared formatDate, formatTime, getPlatformName) |
| `src/utils/api.js` | Exported `API_BASE` |
| `src/context/AppContext.jsx` | Removed dead state + unused import |
| `src/components/screens/Dashboard.jsx` | Cleaned imports, fixed fake rating, use shared formatDate |
| `src/components/screens/EventsScreen.jsx` | Use shared helpers |
| `src/components/screens/EventDetail.jsx` | Use shared helpers |
| `src/components/screens/Appointments.jsx` | Use shared formatDate |
| `src/components/screens/Churches.jsx` | Import API_BASE |
| `src/components/screens/ChurchDetail.jsx` | Import API_BASE |
| `server/src/routes/auth.js` | Added password length validation |

---

### Round 2 (same session)

### 8. Extracted duplicate `timeAgo`/`relativeTime` to shared utility
- **What:** A "relative time" function (e.g., "2h ago", "3d ago") was copy-pasted in 4 files with nearly identical logic:
  - `Notifications.jsx` — called `timeAgo()`
  - `Appointments.jsx` — called `relativeTime()`
  - `ChurchDetail.jsx` — called `relativeTime()`
  - `PrayerBoard.jsx` — called `relativeTime()`
- **Fix:** Added a shared `timeAgo()` function to `src/utils/helpers.js` (using the most complete version with weeks support). Removed all 4 local definitions and updated call sites.
- **Why:** Same DRY principle as items 4-5. One place to change if the format needs updating.
- **Files:** `src/utils/helpers.js`, `src/components/screens/Notifications.jsx`, `src/components/screens/Appointments.jsx`, `src/components/screens/ChurchDetail.jsx`, `src/components/screens/PrayerBoard.jsx`

### 9. Created `.header-spacer` CSS class (replaced 16 inline spacer divs)
- **What:** 16 screen headers used `<div style={{ width: '40px' }} />` (or `width: 40`) as an invisible spacer to balance the back button on the opposite side. All were inline styles doing the exact same thing.
- **Fix:** Added `.header-spacer { width: 40px; }` to index.css (Section 42). Replaced all 16 inline style divs with `<div className="header-spacer" />`.
- **Why:** One CSS class instead of 16 scattered inline styles. If the header layout ever changes (e.g., wider back button), one place to update.
- **Files:** `src/index.css` + `About.jsx`, `AccountDetails.jsx`, `BlockedUsersScreen.jsx`, `CalendarView.jsx`, `ChurchDetail.jsx`, `Contact.jsx`, `FindGuides.jsx`, `Help.jsx`, `MemorizationGame.jsx`, `Notifications.jsx`, `PaymentMethod.jsx`, `Privacy.jsx`, `ReadingPlan.jsx`, `Scripture.jsx`, `Terms.jsx`, `UserProfile.jsx`

### 10. Created `.screen-header-title` CSS class (replaced 9 inline title styles)
- **What:** 9 screen headers used `<h1 style={{ fontSize: '20px', fontWeight: '700' }}>` — the exact same inline style on every sub-screen title.
- **Fix:** Added `.screen-header-title { font-size: 20px; font-weight: 700; }` to index.css (Section 42). Replaced all 9 inline styles with `className="screen-header-title"`.
- **Why:** Consistent title styling from one class. If you ever want to tweak sub-screen header font size, one place to change.
- **Files:** `src/index.css` + `About.jsx`, `AccountDetails.jsx`, `ChurchDetail.jsx`, `Contact.jsx`, `Help.jsx`, `Notifications.jsx`, `PaymentMethod.jsx`, `Privacy.jsx`, `Terms.jsx`

### All files changed in Round 2
| File | Action |
|------|--------|
| `src/utils/helpers.js` | Added `timeAgo()` function |
| `src/index.css` | Added Section 42: `.header-spacer`, `.screen-header-title` |
| `src/components/screens/Notifications.jsx` | Import timeAgo, use header-spacer + title class |
| `src/components/screens/Appointments.jsx` | Import timeAgo, removed local relativeTime |
| `src/components/screens/ChurchDetail.jsx` | Import timeAgo, use header-spacer + title class |
| `src/components/screens/PrayerBoard.jsx` | Import timeAgo, removed local relativeTime |
| `src/components/screens/About.jsx` | Use header-spacer + title class |
| `src/components/screens/AccountDetails.jsx` | Use header-spacer + title class |
| `src/components/screens/BlockedUsersScreen.jsx` | Use header-spacer |
| `src/components/screens/CalendarView.jsx` | Use header-spacer |
| `src/components/screens/Contact.jsx` | Use header-spacer + title class |
| `src/components/screens/FindGuides.jsx` | Use header-spacer |
| `src/components/screens/Help.jsx` | Use header-spacer + title class |
| `src/components/screens/MemorizationGame.jsx` | Use header-spacer |
| `src/components/screens/PaymentMethod.jsx` | Use header-spacer + title class |
| `src/components/screens/Privacy.jsx` | Use header-spacer + title class |
| `src/components/screens/ReadingPlan.jsx` | Use header-spacer |
| `src/components/screens/Scripture.jsx` | Use header-spacer |
| `src/components/screens/Terms.jsx` | Use header-spacer + title class |
| `src/components/screens/UserProfile.jsx` | Use header-spacer |
