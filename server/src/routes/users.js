// ============================================================
// User Routes
// ============================================================
// GET  /api/users/me        - Get current user's profile
// PUT  /api/users/me        - Update profile (name, avatar, photo)
// GET  /api/users/available - List people available to chat with
// GET  /api/users/search    - Search users by name
//
// All routes are protected (require JWT token).
// Replaces: user state and AVAILABLE_PEOPLE in AppContext.jsx
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All user routes require authentication
router.use(authenticate)

// ============================================================
// GET /api/users/me
// ============================================================
// Returns the current logged-in user's profile.
// The user's ID comes from the JWT token (set by auth middleware).
//
// Replaces: user state in AppContext.jsx

router.get('/me', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar, photo_url, role, bio, specialization, location, denomination, church_name, interests, created_at FROM users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        photoUrl: user.photo_url,
        role: user.role,
        bio: user.bio,
        specialization: user.specialization,
        location: user.location,
        denomination: user.denomination,
        churchName: user.church_name,
        interests: user.interests || [],
        createdAt: user.created_at
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PUT /api/users/me
// ============================================================
// Updates the current user's profile.
// Only updates fields that are provided in the request body.
//
// Request body: { name?, avatar?, photoUrl?, bio?, specialization?, location? } (all optional)
// Replaces: updateUserPhoto() in AppContext.jsx

router.put('/me', async (req, res, next) => {
  try {
    const { name, avatar, photoUrl, bio, specialization, location, denomination, churchName, interests } = req.body

    // Build the UPDATE query dynamically based on which fields were provided
    const updates = []
    const values = []
    let paramCount = 0

    if (name !== undefined) {
      paramCount++
      updates.push(`name = $${paramCount}`)
      values.push(name)
    }
    if (avatar !== undefined) {
      paramCount++
      updates.push(`avatar = $${paramCount}`)
      values.push(avatar)
    }
    if (photoUrl !== undefined) {
      paramCount++
      updates.push(`photo_url = $${paramCount}`)
      values.push(photoUrl)
    }
    if (bio !== undefined) {
      paramCount++
      updates.push(`bio = $${paramCount}`)
      values.push(bio)
    }
    if (specialization !== undefined) {
      paramCount++
      updates.push(`specialization = $${paramCount}`)
      values.push(specialization)
    }
    if (location !== undefined) {
      paramCount++
      updates.push(`location = $${paramCount}`)
      values.push(location)
    }
    if (denomination !== undefined) {
      paramCount++
      updates.push(`denomination = $${paramCount}`)
      values.push(denomination)
    }
    if (churchName !== undefined) {
      paramCount++
      updates.push(`church_name = $${paramCount}`)
      values.push(churchName)
    }
    if (interests !== undefined) {
      paramCount++
      updates.push(`interests = $${paramCount}`)
      values.push(interests)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' })
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()')

    // Add the user ID as the last parameter
    paramCount++
    values.push(req.user.id)

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, avatar, photo_url, role, bio, specialization, location, denomination, church_name, interests`,
      values
    )

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        photoUrl: user.photo_url,
        role: user.role,
        bio: user.bio,
        specialization: user.specialization,
        location: user.location,
        denomination: user.denomination,
        churchName: user.church_name,
        interests: user.interests || []
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/users/available
// ============================================================
// Returns a list of users available for starting conversations.
// Excludes the current user from the list.
//
// IMPORTANT: This must be defined BEFORE the /:id route,
// otherwise Express would match "available" as an :id parameter.
//
// Replaces: AVAILABLE_PEOPLE constant in AppContext.jsx

router.get('/available', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, name, avatar, photo_url, role FROM users
       WHERE id != $1
         AND id NOT IN (
           SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
         )
       ORDER BY name ASC`,
      [req.user.id]
    )

    const people = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      photoUrl: row.photo_url,
      role: row.role.charAt(0).toUpperCase() + row.role.slice(1) // "seeker" → "Seeker"
    }))

    res.json({ people })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/users/search?q=name
// ============================================================
// Searches users by name (case-insensitive partial match).
// Returns up to 20 results, excludes the current user.
// Requires at least 2 characters to search.

router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query

    if (!q || q.trim().length < 2) {
      return res.json({ users: [] })
    }

    const result = await pool.query(
      `SELECT id, name, avatar, photo_url, role
       FROM users
       WHERE id != $1 AND name ILIKE $2
         AND id NOT IN (
           SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
         )
       ORDER BY name ASC
       LIMIT 20`,
      [req.user.id, `%${q.trim()}%`]
    )

    const users = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      photoUrl: row.photo_url,
      role: row.role.charAt(0).toUpperCase() + row.role.slice(1)
    }))

    res.json({ users })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/users/suggested?limit=5
// ============================================================
// Returns users NOT connected to (or pending with) the current user
// who share 2+ interests, same denomination, or same favorited church.
// Each result includes a matchReason string explaining the suggestion.

router.get('/suggested', async (req, res, next) => {
  try {
    const userId = req.user.id
    const limit = Math.min(parseInt(req.query.limit) || 5, 20)

    // Get current user's profile
    const meResult = await pool.query(
      'SELECT interests, denomination FROM users WHERE id = $1',
      [userId]
    )
    const me = meResult.rows[0]
    const myInterests = me?.interests || []
    const myDenomination = me?.denomination

    // Get my favorited church IDs
    const myFavsResult = await pool.query(
      'SELECT church_id FROM church_favorites WHERE user_id = $1',
      [userId]
    )
    const myChurchIds = myFavsResult.rows.map(r => r.church_id)

    // Find all users NOT me, NOT connected/pending
    const result = await pool.query(`
      SELECT u.id, u.name, u.avatar, u.photo_url, u.role, u.interests, u.denomination
      FROM users u
      WHERE u.id != $1
        AND u.id NOT IN (
          SELECT CASE WHEN requester_id = $1 THEN recipient_id ELSE requester_id END
          FROM user_connections
          WHERE (requester_id = $1 OR recipient_id = $1)
            AND status IN ('accepted', 'pending')
        )
        AND u.id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
        )
      ORDER BY u.name ASC
    `, [userId])

    // Score each candidate and build match reasons
    const candidates = []
    for (const row of result.rows) {
      const theirInterests = row.interests || []
      const sharedInterests = myInterests.filter(i => theirInterests.includes(i))
      const sameDenomination = myDenomination && row.denomination && myDenomination === row.denomination

      // Check shared favorited churches
      let sharedChurch = null
      if (myChurchIds.length > 0) {
        const theirFavsResult = await pool.query(
          'SELECT cf.church_id, c.name FROM church_favorites cf JOIN churches c ON c.id = cf.church_id WHERE cf.user_id = $1 AND cf.church_id = ANY($2)',
          [row.id, myChurchIds]
        )
        if (theirFavsResult.rows.length > 0) {
          sharedChurch = theirFavsResult.rows[0].name
        }
      }

      // Must match at least one criterion
      if (sharedInterests.length < 2 && !sameDenomination && !sharedChurch) continue

      // Build match reason (most specific first)
      const reasons = []
      if (sharedInterests.length >= 2) reasons.push(`${sharedInterests.length} shared interests`)
      if (sameDenomination) reasons.push(`Same denomination`)
      if (sharedChurch) reasons.push(`Both attend ${sharedChurch}`)

      candidates.push({
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        photoUrl: row.photo_url,
        role: row.role.charAt(0).toUpperCase() + row.role.slice(1),
        matchReason: reasons.join(' · '),
        score: sharedInterests.length + (sameDenomination ? 2 : 0) + (sharedChurch ? 2 : 0)
      })
    }

    // Sort by score descending, take top N
    candidates.sort((a, b) => b.score - a.score)
    const suggested = candidates.slice(0, limit).map(({ score, ...rest }) => rest)

    res.json({ suggested })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/users/:id
// ============================================================
// Returns another user's profile.
// Privacy: bio, location, specialization are hidden for non-connected users.

router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.user.id
    const profileId = req.params.id

    // Check if blocked (bidirectional)
    const blockCheck = await pool.query(
      `SELECT id FROM user_blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)`,
      [userId, profileId]
    )
    if (blockCheck.rows.length > 0) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const result = await pool.query(
      'SELECT id, name, avatar, photo_url, role, bio, specialization, location, denomination, church_name, interests, created_at FROM users WHERE id = $1',
      [profileId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const profile = result.rows[0]

    // Check connection status (is this user connected to me?)
    let isConnected = false
    if (parseInt(profileId) !== userId) {
      const connResult = await pool.query(
        `SELECT id FROM user_connections
         WHERE ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))
           AND status = 'accepted'`,
        [userId, profileId]
      )
      isConnected = connResult.rows.length > 0
    } else {
      isConnected = true // viewing own profile
    }

    res.json({
      user: {
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        photoUrl: profile.photo_url,
        role: profile.role,
        bio: isConnected ? profile.bio : null,
        specialization: isConnected ? profile.specialization : null,
        location: isConnected ? profile.location : null,
        denomination: profile.denomination,
        churchName: profile.church_name,
        interests: profile.interests || [],
        createdAt: profile.created_at,
        isConnected
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
