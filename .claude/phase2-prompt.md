# Phase 2 Carry-Over Prompt

Paste everything below into a new Claude Code window:

---

Read your memory file at `/home/codespace/.claude/projects/-workspaces-SanctuaryV1/memory/MEMORY.md` and the plan file at `.claude/plan.md`.

**Context:** Phase 1 (Profile Photos Enhancement) is complete and committed. All servers are running (Docker, backend on 3001, Vite on 5173). Now implement **Phase 2: Block a User** from the plan file.

## Phase 2 Task List

1. **schema.sql** — Add `user_blocks` table (after `user_connections` ~line 163):
   ```sql
   CREATE TABLE IF NOT EXISTS user_blocks (
     id SERIAL PRIMARY KEY,
     blocker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     blocked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     UNIQUE(blocker_id, blocked_id)
   );
   CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
   CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);
   ```

2. **seed.js** — Add `DROP TABLE IF EXISTS user_blocks CASCADE;` to the DROP section (before user_connections)

3. **New file: `server/src/routes/blocks.js`** — 3 endpoints:
   - `POST /api/blocks` — Block a user (body: `{ blockedId }`)
   - `DELETE /api/blocks/:userId` — Unblock a user
   - `GET /api/blocks` — List blocked users (with name, avatar, photoUrl)

4. **server/src/index.js** — Import and mount: `app.use('/api/blocks', blockRoutes)`

5. **Add block filtering to 7 route files** using this SQL pattern wherever users are listed/joined:
   ```sql
   AND u.id NOT IN (
     SELECT blocked_id FROM user_blocks WHERE blocker_id = $USER_PARAM
     UNION
     SELECT blocker_id FROM user_blocks WHERE blocked_id = $USER_PARAM
   )
   ```
   Files and queries to filter:
   - **community.js**: GET /community (line ~45), GET /pending incoming (line ~78), GET /pending outgoing (line ~90)
   - **conversations.js**: GET / (line ~32, the conversation list query joins users), POST / (line ~76, person lookup)
   - **prayers.js**: GET /prayers (line ~39, prayer authors), GET /:id/comments (line ~205, commenters)
   - **users.js**: GET /available (line ~180), GET /search (line ~213), GET /suggested (line ~265), GET /:id (return 404 if blocked)
   - **events.js**: GET /events (line ~36, event creators), GET /:id attendees list (line ~149)
   - **churches.js**: GET /:id/members (the members query), reviews (filter blocked reviewers)
   - **home.js**: GET /home community activity (line ~88, prayer authors from connections)

6. **New file: `src/components/screens/BlockedUsersScreen.jsx`** — Screen to manage blocked users:
   - List all blocked users with Avatar, name, role
   - "Unblock" button per user
   - Back button header
   - Empty state when no blocks

7. **Update `UserProfile.jsx`** — Add a 3-dot menu (MoreVertical icon) in the header:
   - "Block User" option (red text)
   - On block: call POST /api/blocks, then navigate back
   - Don't show menu for your own profile (connectionStatus === 'self')

8. **Update `Profile.jsx`** — Add "Blocked Users" to the Account section menu items (with ShieldOff icon)

9. **Update `App.jsx`** — Import BlockedUsersScreen, add route: `/blocked-users`

10. **CSS in `index.css`** — Add styles for:
    - `.three-dot-menu` — absolute positioned menu button in UserProfile header
    - `.three-dot-dropdown` — dropdown with menu items
    - `.blocked-user-card` — card in BlockedUsersScreen
    - `.unblock-btn` — unblock button style

## Key Rules
- All block checks are server-side in SQL — never trust the frontend
- Blocking is bidirectional: if A blocks B, both become invisible to each other
- When blocking, also delete any existing connection between the two users
- After each file, reseed: `cd server && npm run seed`
- Test on port 5173 after completing everything
