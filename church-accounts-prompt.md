# Church Accounts v1 — Build Prompt

## What You're Building

A **separate account type** for churches in the Sanctuary app. Church accounts are like Facebook Business Pages — they exist independently from user accounts (guide/seeker). A church logs in as the church itself, not as an individual. The church decides internally who has the password.

**v1 Scope:**
1. Church account registration & login (separate auth flow)
2. Church Dashboard (admin overview screen)
3. Church Profile Editor (edit bio, service times, programs)
4. Congregation View (see which app users belong to this church)
5. Guide Verification (vouch for guides acting on behalf of the church)

**NOT in v1 (save for later):** Church-posted events, photo uploads, messaging, study regimens.

---

## IMPORTANT: Existing Codebase Patterns

Follow these patterns exactly — don't introduce new libraries or approaches.

### Tech Stack
- **Frontend**: React 18 + Vite 5, React Router v6, React Context, Plain CSS, Lucide React
- **Backend**: Node.js + Express 5, PostgreSQL 16 (via Docker container `sanctuary-db`), JWT auth, bcryptjs
- **ESM**: Project uses `"type": "module"` — use `import/export`, not `require`

### Token Management (src/utils/api.js)
- `getToken()` / `setToken(token)` / `removeToken()` manage `localStorage.sanctuary_token`
- `apiFetch()` attaches token as `Bearer` header automatically
- `API_BASE = import.meta.env.VITE_API_URL || ''` (empty in dev, full URL in prod)
- For church accounts, create parallel functions: `getChurchToken()` / `setChurchToken()` / `removeChurchToken()` using key `sanctuary_church_token`
- Create a `churchApi` object (same pattern as `api`) that uses the church token instead

### JWT Pattern (server/src/routes/auth.js)
- `createToken(userId)` signs `{ userId }` with `process.env.JWT_SECRET`
- For church accounts: `createChurchToken(churchAccountId, churchId)` signs `{ churchAccountId, churchId, type: 'church' }`
- Same secret, same expiry (`process.env.JWT_EXPIRES_IN || '7d'`)

### Auth Middleware (server/src/middleware/auth.js)
- `authenticate` reads `Bearer` token, verifies, sets `req.user = { id: decoded.userId }`
- Create `authenticateChurch` in new file `server/src/middleware/churchAuth.js` — same pattern but:
  - Verifies token has `type === 'church'`
  - Sets `req.church = { accountId: decoded.churchAccountId, churchId: decoded.churchId }`

### CSS Patterns (src/index.css)
- All styles in one file, organized by numbered sections (currently 41 sections)
- Add section 42 for church dashboard/editor styles
- Use existing CSS variables: `var(--bg-primary)`, `var(--bg-secondary)`, `var(--text-primary)`, `var(--text-muted)`, `var(--accent-gold)`, `var(--accent-burgundy)`, `var(--border-warm)`
- Dark mode via `[data-theme="dark"]` selectors
- Card pattern: use existing `Card` component from `src/components/common`
- Gold accent for church/prestige elements, burgundy for action buttons

### Route Registration (server/src/index.js)
- Import and register: `app.use('/api/church-auth', churchAuthRoutes)`
- Follow the existing pattern of other route imports at top of file

### App Routing (src/App.jsx)
- Protected routes wrap in `<ProtectedRoute>` which checks `user` from AppContext
- For church routes, create `<ChurchProtectedRoute>` which checks `churchAccount` from AppContext
- Add church paths to `noNavPages` array (church accounts don't get the bottom nav bar)
- Church login redirects to `/church-dashboard`, not `/dashboard`

### CRITICAL — migrate.js rule
When adding columns to existing tables in `schema.sql`, ALWAYS also add matching `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` to the `columnMigrations` array in `server/src/seeds/migrate.js`. Without this, production deploys crash.

---

## Step 1: Database Changes

### File: `server/src/config/schema.sql`

Add these AFTER the `guide_waitlist` table and BEFORE the "DEFERRED FOREIGN KEYS" section:

```sql
-- ============================================================
-- CHURCH ACCOUNTS TABLE
-- ============================================================
-- Separate account type for churches to manage their own pages.
-- One account per church. Login is separate from user accounts.
-- Status: pending (awaiting verification), active (can log in), suspended.

CREATE TABLE IF NOT EXISTS church_accounts (
  id              SERIAL PRIMARY KEY,
  church_id       INTEGER REFERENCES churches(id) UNIQUE NOT NULL,
  email           VARCHAR(255) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  display_name    VARCHAR(255),
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'suspended')),
  verified_at     TIMESTAMP WITH TIME ZONE,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_church_accounts_email ON church_accounts(email);
CREATE INDEX IF NOT EXISTS idx_church_accounts_church_id ON church_accounts(church_id);

-- ============================================================
-- CHURCH ACCOUNT GUIDES TABLE
-- ============================================================
-- Links church accounts to verified guides. Every church account
-- must have at least one linked guide (physical representation).
-- Guides can be verified/vouched for by the church.

CREATE TABLE IF NOT EXISTS church_account_guides (
  church_account_id INTEGER REFERENCES church_accounts(id) ON DELETE CASCADE,
  guide_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
  verified_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (church_account_id, guide_id)
);
```

Add these columns to the existing `churches` table definition (add them after the existing columns but before `created_at`):

```sql
  custom_description TEXT,
  custom_hours       TEXT,
  custom_programs    TEXT,
  managed_by         INTEGER,
```

Note: Don't add a REFERENCES constraint on `managed_by` in the CREATE TABLE since `church_accounts` is defined after `churches`. Instead, add it to the deferred foreign keys section:

```sql
-- Inside the DO $$ block, add:
IF NOT EXISTS (
  SELECT 1 FROM information_schema.table_constraints
  WHERE constraint_name = 'fk_churches_managed_by'
) THEN
  ALTER TABLE churches ADD CONSTRAINT fk_churches_managed_by
    FOREIGN KEY (managed_by) REFERENCES church_accounts(id) ON DELETE SET NULL;
END IF;
```

### File: `server/src/seeds/migrate.js`

Add to the `columnMigrations` array:

```js
// Session 30: Church accounts — new columns on churches table
'ALTER TABLE churches ADD COLUMN IF NOT EXISTS custom_description TEXT',
'ALTER TABLE churches ADD COLUMN IF NOT EXISTS custom_hours TEXT',
'ALTER TABLE churches ADD COLUMN IF NOT EXISTS custom_programs TEXT',
'ALTER TABLE churches ADD COLUMN IF NOT EXISTS managed_by INTEGER',
```

Also add a test church account section AFTER the Jordan Rivera test account section. Find the church "Willow Creek Church" (or the first church in the DB) and create a church account for it:

```js
// ---- Church test account ----
console.log('⛪ Ensuring test church account exists...')
const willowCreek = await client.query(
  "SELECT id FROM churches WHERE name ILIKE '%willow creek%' LIMIT 1"
)
if (willowCreek.rows.length > 0) {
  const churchId = willowCreek.rows[0].id
  const churchAcctCheck = await client.query(
    'SELECT id FROM church_accounts WHERE church_id = $1', [churchId]
  )
  if (churchAcctCheck.rows.length === 0) {
    const result = await client.query(
      `INSERT INTO church_accounts (church_id, email, password_hash, display_name, status, verified_at)
       VALUES ($1, $2, $3, $4, 'active', NOW())
       RETURNING id`,
      [churchId, 'church@sanctuary.com', passwordHash, 'Willow Creek Admin']
    )
    // Link Pastor Mike as a verified guide
    const mike = await client.query("SELECT id FROM users WHERE email = 'test@sanctuary.com'")
    if (mike.rows.length > 0) {
      await client.query(
        'INSERT INTO church_account_guides (church_account_id, guide_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [result.rows[0].id, mike.rows[0].id]
      )
    }
    // Set managed_by on the church
    await client.query('UPDATE churches SET managed_by = $1 WHERE id = $2', [result.rows[0].id, churchId])
    console.log('   ✅ Willow Creek church account created (church@sanctuary.com)')
  } else {
    console.log('   ✅ Willow Creek church account already exists')
  }
} else {
  console.log('   ⚠️  Willow Creek Church not found — skipping church account')
}
```

---

## Step 2: Backend — Church Auth Middleware

### New file: `server/src/middleware/churchAuth.js`

```js
// Same pattern as auth.js but for church accounts.
// Verifies the JWT has type: 'church' and sets req.church.

import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

export function authenticateChurch(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Ensure this is a church token, not a user token
    if (decoded.type !== 'church') {
      return res.status(401).json({ error: 'Invalid token type. Church login required.' })
    }

    req.church = {
      accountId: decoded.churchAccountId,
      churchId: decoded.churchId
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' })
  }
}
```

---

## Step 3: Backend — Church Auth Routes

### New file: `server/src/routes/church-auth.js`

Endpoints to build:

**POST `/api/church-auth/register`**
- Body: `{ email, password, churchId, displayName, guideId }`
- Validates:
  - email, password (min 8 chars), churchId, displayName, guideId all required
  - Church exists (query churches table)
  - Church not already claimed (check church_accounts for this church_id)
  - Email not already taken (check church_accounts table — NOT users table, these are separate)
  - Guide exists and has role='guide' (query users table)
- Creates:
  - `church_accounts` row with status='pending' (NOTE: for the test seed we set 'active', but real registrations start as 'pending')
  - `church_account_guides` row linking the guide
  - Updates `churches.managed_by` to the new church_accounts.id
- Returns: `{ message: 'Church account created. Pending verification.' }` (no token for pending accounts)

**POST `/api/church-auth/login`**
- Body: `{ email, password }`
- Checks `church_accounts` table (NOT users table)
- If account status is 'pending': return 403 with `{ error: 'Your church account is pending verification. Please check back within 48 hours.' }`
- If account status is 'suspended': return 403 with `{ error: 'This church account has been suspended.' }`
- Only status='active' can login
- On success, query the linked church for church name, overall_rating, review_count, google_place_id
- Returns: `{ token, churchAccount: { accountId, churchId, churchName, displayName, email, googlePlaceId, overallRating, reviewCount, status } }`
- Token payload: `{ churchAccountId: account.id, churchId: account.church_id, type: 'church' }`

**GET `/api/church-auth/me`** (requires `authenticateChurch` middleware)
- Returns the church account profile + church details + linked guides
- Query church_accounts JOIN churches for full church data
- Query church_account_guides JOIN users for linked guide names/photos
- Also query: count of church_favorites for this church (congregation size), count of church_reviews
- Returns: `{ churchAccount: { accountId, email, displayName, status, church: { id, name, address, city, state, customDescription, customHours, customPrograms, googlePlaceId, overallRating, reviewCount, googleRating }, guides: [{ id, name, photoUrl, avatar }], stats: { memberCount, reviewCount } } }`

**PUT `/api/church-auth/profile`** (requires `authenticateChurch` middleware)
- Body: `{ displayName?, customDescription?, customHours?, customPrograms? }`
- Updates `church_accounts.display_name` if provided
- Updates `churches.custom_description`, `churches.custom_hours`, `churches.custom_programs` if provided
- Returns the updated church account (same format as GET /me)

**GET `/api/church-auth/congregation`** (requires `authenticateChurch` middleware)
- Returns all users who belong to this church (favorited it, reviewed it, or have it as preferred_church_id)
- Query:
  ```sql
  SELECT DISTINCT u.id, u.name, u.avatar, u.photo_url, u.role, u.city, u.state
  FROM users u
  WHERE u.id IN (
    SELECT user_id FROM church_favorites WHERE church_id = $1
    UNION
    SELECT user_id FROM church_reviews WHERE church_id = $1
    UNION
    SELECT id FROM users WHERE preferred_church_id = $1
  )
  ORDER BY u.name ASC
  ```
- Returns: `{ members: [{ id, name, avatar, photoUrl, role, city, state }] }`

**POST `/api/church-auth/verify-guide`** (requires `authenticateChurch` middleware)
- Body: `{ guideId }`
- Validates: guide exists, has role='guide'
- Inserts into church_account_guides (ON CONFLICT DO NOTHING)
- Returns: `{ success: true, guide: { id, name } }`

**DELETE `/api/church-auth/verify-guide/:guideId`** (requires `authenticateChurch` middleware)
- Removes a guide from church_account_guides
- But prevent removing the LAST guide (at least one must remain)
- Returns: `{ success: true }`

Register in `server/src/index.js`:
```js
import churchAuthRoutes from './routes/church-auth.js'
// Add with the other app.use lines:
app.use('/api/church-auth', churchAuthRoutes)
```

---

## Step 4: Frontend — API Helpers

### File: `src/utils/api.js`

Add church token management functions alongside the existing user ones:

```js
// Church account token management (separate from user tokens)
export function getChurchToken() {
  return localStorage.getItem('sanctuary_church_token')
}

export function setChurchToken(token) {
  localStorage.setItem('sanctuary_church_token', token)
}

export function removeChurchToken() {
  localStorage.removeItem('sanctuary_church_token')
}
```

Add a `churchApi` object that uses the church token:

```js
async function churchApiFetch(endpoint, options = {}) {
  const token = getChurchToken()

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong')
    error.status = response.status
    throw error
  }

  return data
}

export const churchApi = {
  get: (endpoint) => churchApiFetch(endpoint),
  post: (endpoint, body) => churchApiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  put: (endpoint, body) => churchApiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  delete: (endpoint) => churchApiFetch(endpoint, {
    method: 'DELETE',
  }),
}
```

---

## Step 5: Frontend — AppContext Changes

### File: `src/context/AppContext.jsx`

Add church account state and functions. Keep them separate from the user state — they're independent systems.

**New state:**
```js
const [churchAccount, setChurchAccount] = useState(null)
const [isChurchLoading, setIsChurchLoading] = useState(false)
```

**New functions:**

```js
async function churchLogin(email, password) {
  try {
    const data = await churchApi.post('/church-auth/login', { email, password })
    setChurchToken(data.token)
    setChurchAccount(data.churchAccount)
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function churchLogout() {
  removeChurchToken()
  setChurchAccount(null)
}
```

**Initialization:** In the existing `useEffect` initialization block, AFTER the user token check, also check for a church token:

```js
// Check for church session
const cToken = getChurchToken()
if (cToken) {
  try {
    const { churchAccount: acct } = await churchApi.get('/church-auth/me')
    setChurchAccount(acct)
  } catch {
    removeChurchToken()
  }
}
```

**Add to context value:**
```js
churchAccount,
isChurchLoading,
churchLogin,
churchLogout,
```

Import `getChurchToken`, `setChurchToken`, `removeChurchToken`, `churchApi` from api.js.

---

## Step 6: Frontend — Login Screen Toggle

### File: `src/components/screens/LoginScreen.jsx`

Add a segmented toggle above the form card to switch between "User" and "Church" login modes.

**New state:**
```js
const [loginMode, setLoginMode] = useState('user') // 'user' or 'church'
```

**Get `churchLogin` from context:**
```js
const { login, churchLogin } = useApp()
```

**Add toggle UI** — place it between the logo area and the form card:
```jsx
<div className="login-mode-toggle">
  <button
    className={`login-mode-btn ${loginMode === 'user' ? 'active' : ''}`}
    onClick={() => { setLoginMode('user'); setError('') }}
  >
    User
  </button>
  <button
    className={`login-mode-btn ${loginMode === 'church' ? 'active' : ''}`}
    onClick={() => { setLoginMode('church'); setError('') }}
  >
    Church
  </button>
</div>
```

**Modify the form card heading** to be dynamic:
- User mode: "Welcome Back" / "Sign in to continue"
- Church mode: "Church Login" / "Sign in to manage your church page"

**Modify `handleSubmit`:**
```js
if (loginMode === 'church') {
  const result = await churchLogin(email, password)
  if (result.success) {
    navigate('/church-dashboard')
  } else {
    setError(result.error)
  }
} else {
  // existing user login flow
  const result = await login(email, password)
  if (result.success) {
    navigate('/dashboard')
  } else {
    setError(result.error)
  }
}
```

**Hide the "Sign Up" and "Forgot Password" links** when in church mode (church accounts are created through invite/request, not self-service sign-up in v1).

**Add icon:** Use `Church` icon from lucide-react next to the "Church" toggle button for visual clarity.

---

## Step 7: Frontend — Church Dashboard

### New file: `src/components/screens/ChurchDashboard.jsx`

This is the main screen church accounts see after logging in. It's an admin overview, NOT a user dashboard.

**Layout:**
- Header: Church name + "Managed Page" badge (gold accent)
- Church photo (use Google proxy: `${API_BASE}/api/churches/photo/${googlePlaceId}` if available, fallback to Church icon)
- Quick stats row: Reviews count, Member count (from GET /me stats)
- Navigation cards (tappable, using the existing Card component):
  1. **Edit Profile** — icon: Pencil, navigates to `/church-profile-editor`
  2. **Congregation** — icon: Users, navigates to `/church-congregation`
  3. **Verified Guides** — icon: Shield/ShieldCheck, navigates to `/church-guides`
- Logout button at bottom

**Data loading:** On mount, call `GET /church-auth/me` to get fresh church data (via `churchApi`).

**No bottom nav** — church accounts don't use the 4-tab navigation.

Add a simple back-to-top header with the church name and a logout button (similar to how detail pages have a back arrow, but this has logout instead).

---

## Step 8: Frontend — Church Profile Editor

### New file: `src/components/screens/ChurchProfileEditor.jsx`

**Fields (all textareas/inputs):**
- **Display Name** — text input (the name shown for the admin account)
- **Church Description** — textarea, pre-filled with `church.customDescription` or falls back to `church.shortDescription` as placeholder
- **Service Times** — textarea, pre-filled with `church.customHours` or Google hours as placeholder
- **Programs & Ministries** — textarea for listing programs (youth group, bible study, outreach, etc.)

**Save button:** Calls `PUT /church-auth/profile` with the updated fields.

**Back button:** Returns to `/church-dashboard`.

**UX:** Show a "Changes saved!" success message after successful save, auto-dismiss after 2 seconds.

---

## Step 9: Frontend — Congregation View

### New file: `src/components/screens/ChurchCongregation.jsx`

Shows all Sanctuary users who belong to this church.

**Data:** Call `GET /church-auth/congregation` on mount.

**Display:** List of user cards showing:
- Avatar (use existing Avatar component pattern — photo_url first, fallback to emoji avatar)
- Name
- Role badge (Guide = gold, Seeker = blue — use existing badge colors)
- City, State

**Empty state:** "No members yet. As users join Sanctuary and favorite your church, they'll appear here."

**Back button** to `/church-dashboard`.

**NOTE:** This is a read-only view. The church can see who's in their congregation but can't message or interact with them from the church account. Interaction happens through individual user accounts.

---

## Step 10: Frontend — Guide Verification

### New file: `src/components/screens/ChurchGuides.jsx`

Shows verified guides linked to this church account, with ability to add/remove.

**Data:** The linked guides come from the `GET /church-auth/me` response (the `guides` array).

**Display:**
- List of verified guide cards (avatar, name, "Verified Guide" badge in gold)
- Each card has a remove button (X icon) — but disable if only 1 guide remains (show tooltip: "At least one guide required")

**Add Guide section:**
- A search input to find guides by name
- Calls `GET /api/users/guides?q=searchTerm` (this endpoint already exists and is accessible with a regular user token — but since church accounts use a different token, you'll need to either make this endpoint accept church tokens too, OR create a simple `GET /church-auth/search-guides?q=` endpoint that does the same query)
- Recommended: Create a new `GET /church-auth/search-guides?q=` endpoint that queries `SELECT id, name, avatar, photo_url FROM users WHERE role = 'guide' AND name ILIKE '%' || $1 || '%' LIMIT 10`
- Results show with an "Add" button → calls `POST /church-auth/verify-guide`

**Back button** to `/church-dashboard`.

---

## Step 11: App Routing

### File: `src/App.jsx`

**Import new screens:**
```js
import ChurchDashboard from './components/screens/ChurchDashboard'
import ChurchProfileEditor from './components/screens/ChurchProfileEditor'
import ChurchCongregation from './components/screens/ChurchCongregation'
import ChurchGuides from './components/screens/ChurchGuides'
```

**Add `ChurchProtectedRoute` component:**
```jsx
function ChurchProtectedRoute({ children }) {
  const { churchAccount, isLoading } = useApp()

  if (isLoading) {
    return <div className="screen"><LoadingSpinner size={48} /></div>
  }

  if (!churchAccount) {
    return <Navigate to="/login" replace />
  }

  return children
}
```

**Add routes** (inside the Routes block, after the existing protected routes):
```jsx
{/* ====== CHURCH ACCOUNT ROUTES ====== */}
<Route path="/church-dashboard" element={<ChurchProtectedRoute><ChurchDashboard /></ChurchProtectedRoute>} />
<Route path="/church-profile-editor" element={<ChurchProtectedRoute><ChurchProfileEditor /></ChurchProtectedRoute>} />
<Route path="/church-congregation" element={<ChurchProtectedRoute><ChurchCongregation /></ChurchProtectedRoute>} />
<Route path="/church-guides" element={<ChurchProtectedRoute><ChurchGuides /></ChurchProtectedRoute>} />
```

**Update `noNavPages`:**
```js
const noNavPages = ['/login', '/signup', '/forgot-password', '/chat', '/bibles/reader', '/walk-on-water', '/church-dashboard', '/church-profile-editor', '/church-congregation', '/church-guides']
```

**Update login redirect:** In the `/login` route, also check for `churchAccount`:
```jsx
<Route
  path="/login"
  element={
    user ? <Navigate to="/dashboard" replace /> :
    churchAccount ? <Navigate to="/church-dashboard" replace /> :
    <LoginScreen />
  }
/>
```

---

## Step 12: CSS Styles

### File: `src/index.css`

Add a new section (Section 42) for church account styles. Here's what you need:

**Login mode toggle:**
```css
.login-mode-toggle {
  display: flex;
  gap: 0;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
  width: 100%;
  max-width: 320px;
}

.login-mode-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.login-mode-btn.active {
  background: var(--bg-primary);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

**Church Dashboard styles:**
- `.church-dashboard` — padding, flex column layout
- `.church-dashboard-header` — church name, badge, photo
- `.church-stats-row` — horizontal flex for stats
- `.church-stat-card` — small card with number + label
- `.church-nav-grid` — grid of navigation cards (2 columns)
- `.church-nav-card` — tappable card with icon + label, warm border, hover scale
- `.church-managed-badge` — gold pill badge saying "Managed Page"

**Church Profile Editor styles:**
- `.church-editor` — form container
- `.church-editor-field` — labeled textarea/input groups
- `.church-editor-label` — 14px bold label above input
- `.church-editor-textarea` — textarea with min-height 120px, border, rounded
- `.church-editor-save` — full-width gold accent save button
- `.church-editor-success` — green success message

**Church Congregation / Guides styles:**
- Reuse existing patterns from community screen (user cards with avatars, role badges)
- `.church-member-list` — flex column, gap between cards
- `.church-guide-verified` — gold "Verified" badge

Use gold accent (`var(--accent-gold)`) for the managed badge, verified guide badges, and stat highlights. Use the existing card pattern for navigation cards. Keep it clean and admin-focused — this isn't a flashy user-facing page.

---

## Step 13: Seed & Test

After building everything:

1. Run `cd server && npm run seed` to recreate all tables with the new schema
2. The seed should create the test church account: `church@sanctuary.com` / `Sanctuary123`
3. Test the flow:
   - Go to login page → toggle to "Church" → login with `church@sanctuary.com` / `Sanctuary123`
   - Should land on Church Dashboard showing Willow Creek Church
   - Navigate to Edit Profile → change description → save → verify it persists
   - Navigate to Congregation → should show any users who favorited Willow Creek
   - Navigate to Verified Guides → should show Pastor Mike as a verified guide

---

## How to Start Dev Servers

```bash
docker compose up -d          # PostgreSQL
cd server && npm run seed     # Recreate tables + seed data
cd server && npm run dev      # Express on port 3001
npm run dev                   # Vite on port 5173 (from project root)
```

---

## Files to CREATE:
1. `server/src/middleware/churchAuth.js`
2. `server/src/routes/church-auth.js`
3. `src/components/screens/ChurchDashboard.jsx`
4. `src/components/screens/ChurchProfileEditor.jsx`
5. `src/components/screens/ChurchCongregation.jsx`
6. `src/components/screens/ChurchGuides.jsx`

## Files to MODIFY:
1. `server/src/config/schema.sql` — 2 new tables + 4 new columns on churches + deferred FK
2. `server/src/seeds/migrate.js` — column migrations + test church account
3. `server/src/index.js` — register church-auth routes
4. `src/utils/api.js` — church token functions + churchApi object
5. `src/context/AppContext.jsx` — church account state + login/logout + initialization
6. `src/components/screens/LoginScreen.jsx` — User/Church toggle
7. `src/App.jsx` — ChurchProtectedRoute + 4 new routes + noNavPages + login redirect
8. `src/index.css` — Section 42: Church Account styles

## Test credentials:
- **User (guide):** test@sanctuary.com / Sanctuary123
- **User (seeker):** jordan@sanctuary.com / Sanctuary123
- **Church account:** church@sanctuary.com / Sanctuary123

## Forward-thinking notes (DO NOT BUILD, just be aware):
- The `events` table already has a `church_id` column — future church-posted events will use this
- The `church_announcements` table currently only lets guides post — future: church accounts will post too
- Church photo uploads will need a storage solution (Cloudinary) — not in v1
- Study regimens/recommendations from churches — future feature, not in v1
