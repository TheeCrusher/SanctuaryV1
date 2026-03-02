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
import STATE_BORDERS from '../utils/stateBorders.js'

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
      'SELECT id, name, email, avatar, photo_url, role, bio, specialization, location, state, city, preferred_church_id, denomination, church_name, interests, phone_number, accepting_seekers, max_pending_requests, onboarding_completed, follower_count, overall_rating, review_count, created_at FROM users WHERE id = $1',
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
        state: user.state,
        city: user.city,
        preferredChurchId: user.preferred_church_id,
        denomination: user.denomination,
        churchName: user.church_name,
        interests: user.interests || [],
        phoneNumber: user.phone_number,
        acceptingSeekers: user.accepting_seekers,
        maxPendingRequests: user.max_pending_requests,
        onboardingCompleted: user.onboarding_completed,
        followerCount: user.follower_count || 0,
        overallRating: parseFloat(user.overall_rating) || 0,
        reviewCount: user.review_count || 0,
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
    const { name, avatar, photoUrl, bio, specialization, location, state, city, preferredChurchId, denomination, churchName, interests, phoneNumber, acceptingSeekers, maxPendingRequests, onboardingCompleted } = req.body

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
    if (phoneNumber !== undefined) {
      paramCount++
      updates.push(`phone_number = $${paramCount}`)
      values.push(phoneNumber || null)
    }
    if (state !== undefined) {
      paramCount++
      updates.push(`state = $${paramCount}`)
      values.push(state || null)
    }
    if (city !== undefined) {
      paramCount++
      updates.push(`city = $${paramCount}`)
      values.push(city || null)
    }
    if (preferredChurchId !== undefined) {
      paramCount++
      updates.push(`preferred_church_id = $${paramCount}`)
      values.push(preferredChurchId || null)
    }
    if (acceptingSeekers !== undefined) {
      paramCount++
      updates.push(`accepting_seekers = $${paramCount}`)
      values.push(acceptingSeekers)
    }
    if (maxPendingRequests !== undefined) {
      paramCount++
      updates.push(`max_pending_requests = $${paramCount}`)
      values.push(Math.max(1, Math.min(20, Number(maxPendingRequests))))
    }
    if (onboardingCompleted !== undefined) {
      paramCount++
      updates.push(`onboarding_completed = $${paramCount}`)
      values.push(onboardingCompleted)
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
       RETURNING id, name, email, avatar, photo_url, role, bio, specialization, location, state, city, preferred_church_id, denomination, church_name, interests, phone_number, accepting_seekers, max_pending_requests, onboarding_completed`,
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
        state: user.state,
        city: user.city,
        preferredChurchId: user.preferred_church_id,
        denomination: user.denomination,
        churchName: user.church_name,
        interests: user.interests || [],
        phoneNumber: user.phone_number,
        acceptingSeekers: user.accepting_seekers,
        maxPendingRequests: user.max_pending_requests,
        onboardingCompleted: user.onboarding_completed
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
// GET /api/users/guides
// ============================================================
// Returns guides for the "Find a Guide" screen.
// Supports location-based filtering via scope parameter:
//   local    - same state (sub-sorted: same church > same city > rest)
//   regional - bordering/neighboring states
//   national - all remaining guides (not local or regional)
// If no scope or no user state, returns all guides.
// Excludes blocked users. Sorted: accepting first, then available slots, then name.

router.get('/guides', async (req, res, next) => {
  try {
    const userId = req.user.id
    const { q, scope, state: userState, city: userCity, churchId, sort } = req.query

    let query = `
      SELECT
        u.id, u.name, u.avatar, u.photo_url, u.specialization,
        u.denomination, u.state, u.city, u.church_name, u.bio,
        u.accepting_seekers, u.max_pending_requests, u.preferred_church_id,
        u.overall_rating, u.review_count, u.follower_count,
        COALESCE(pending.count, 0)::int AS pending_count
      FROM users u
      LEFT JOIN (
        SELECT guide_id, COUNT(*) AS count
        FROM appointments
        WHERE status = 'pending'
        GROUP BY guide_id
      ) pending ON pending.guide_id = u.id
      WHERE u.role = 'guide'
        AND u.id != $1
        AND u.id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
        )
    `
    const params = [userId]
    let paramCount = 1

    // Text search filter
    if (q && q.trim().length >= 2) {
      paramCount++
      query += ` AND (
        u.name ILIKE $${paramCount}
        OR u.specialization ILIKE $${paramCount}
        OR u.denomination ILIKE $${paramCount}
      )`
      params.push(`%${q.trim()}%`)
    }

    // Location scope filter (only if user has a state set)
    if (scope && userState) {
      if (scope === 'local') {
        paramCount++
        query += ` AND u.state = $${paramCount}`
        params.push(userState)
      } else if (scope === 'regional') {
        const borders = STATE_BORDERS[userState] || []
        if (borders.length > 0) {
          paramCount++
          query += ` AND u.state = ANY($${paramCount})`
          params.push(borders)
        } else {
          // No bordering states (AK, HI) — return empty
          query += ` AND FALSE`
        }
      } else if (scope === 'national') {
        const borders = STATE_BORDERS[userState] || []
        const excludeStates = [userState, ...borders]
        paramCount++
        query += ` AND (u.state IS NULL OR NOT (u.state = ANY($${paramCount})))`
        params.push(excludeStates)
      }
    }

    // Sorting: top-rated sort overrides all other sort logic
    if (sort === 'rating') {
      query += ` ORDER BY u.overall_rating DESC, u.follower_count DESC, u.review_count DESC, u.name ASC`
    } else if (scope === 'local' && userState) {
      // Local: accepting first, then available slots, then proximity (church > city), then name
      let orderClauses = [
        'u.accepting_seekers DESC',
        'CASE WHEN COALESCE(pending.count, 0) < u.max_pending_requests THEN 0 ELSE 1 END ASC'
      ]
      if (churchId) {
        orderClauses.push(`CASE WHEN u.preferred_church_id = ${parseInt(churchId)} THEN 0 ELSE 1 END ASC`)
      }
      if (userCity) {
        paramCount++
        orderClauses.push(`CASE WHEN LOWER(u.city) = LOWER($${paramCount}) THEN 0 ELSE 1 END ASC`)
        params.push(userCity)
      }
      orderClauses.push('u.name ASC')
      query += ` ORDER BY ${orderClauses.join(', ')}`
    } else {
      query += ` ORDER BY
        u.accepting_seekers DESC,
        CASE WHEN COALESCE(pending.count, 0) < u.max_pending_requests THEN 0 ELSE 1 END ASC,
        u.name ASC`
    }

    const result = await pool.query(query, params)

    const guides = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      photoUrl: row.photo_url,
      specialization: row.specialization,
      denomination: row.denomination,
      state: row.state,
      city: row.city,
      churchName: row.church_name,
      bio: row.bio,
      acceptingSeekers: row.accepting_seekers,
      pendingCount: row.pending_count,
      overallRating: parseFloat(row.overall_rating) || 0,
      reviewCount: row.review_count || 0,
      followerCount: row.follower_count || 0,
      maxPendingRequests: row.max_pending_requests
    }))

    res.json({ guides })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/users/waitlist
// ============================================================
// Join a guide's waitlist. Body: { guideId }
router.post('/waitlist', async (req, res, next) => {
  try {
    const seekerId = req.user.id
    const { guideId } = req.body

    if (!guideId) {
      return res.status(400).json({ error: 'guideId is required.' })
    }

    // Verify the guide exists and is a guide
    const guideCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1',
      [guideId]
    )
    if (guideCheck.rows.length === 0 || guideCheck.rows[0].role !== 'guide') {
      return res.status(404).json({ error: 'Guide not found.' })
    }

    // Insert (ignore if already exists)
    await pool.query(
      `INSERT INTO guide_waitlist (guide_id, seeker_id)
       VALUES ($1, $2)
       ON CONFLICT (guide_id, seeker_id) DO NOTHING`,
      [guideId, seekerId]
    )

    res.status(201).json({ success: true })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/users/waitlist/:guideId
// ============================================================
// Leave a guide's waitlist.
router.delete('/waitlist/:guideId', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM guide_waitlist WHERE guide_id = $1 AND seeker_id = $2',
      [req.params.guideId, req.user.id]
    )
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/users/:id
// ============================================================
// Returns another user's profile.
// Privacy: bio, location, specialization are hidden for non-connected users.
// For guides: includes availability info and waitlist status.

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
      'SELECT id, name, avatar, photo_url, role, bio, specialization, location, state, city, denomination, church_name, interests, accepting_seekers, max_pending_requests, overall_rating, review_count, follower_count, created_at FROM users WHERE id = $1',
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

    // For guides: get pending appointment count, waitlist status, follow status, and own review
    let pendingCount = 0
    let onWaitlist = false
    let isFollowing = false
    let myReview = null
    if (profile.role === 'guide' && parseInt(profileId) !== userId) {
      const [pendingResult, waitlistCheck, followCheck, reviewCheck] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS count FROM appointments
           WHERE guide_id = $1 AND status = 'pending'`,
          [profileId]
        ),
        pool.query(
          `SELECT id FROM guide_waitlist
           WHERE guide_id = $1 AND seeker_id = $2 AND notified_at IS NULL`,
          [profileId, userId]
        ),
        pool.query(
          `SELECT id FROM guide_follows WHERE follower_id = $1 AND guide_id = $2`,
          [userId, profileId]
        ),
        pool.query(
          `SELECT id, rating, review_text, created_at FROM guide_reviews
           WHERE guide_id = $1 AND seeker_id = $2`,
          [profileId, userId]
        ),
      ])
      pendingCount = pendingResult.rows[0].count
      onWaitlist = waitlistCheck.rows.length > 0
      isFollowing = followCheck.rows.length > 0
      if (reviewCheck.rows.length > 0) {
        const r = reviewCheck.rows[0]
        myReview = { id: r.id, rating: r.rating, reviewText: r.review_text, createdAt: r.created_at }
      }
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
        state: profile.state,
        city: profile.city,
        denomination: profile.denomination,
        churchName: profile.church_name,
        interests: profile.interests || [],
        acceptingSeekers: profile.accepting_seekers,
        maxPendingRequests: profile.max_pending_requests,
        overallRating: parseFloat(profile.overall_rating) || 0,
        reviewCount: profile.review_count || 0,
        followerCount: profile.follower_count || 0,
        pendingCount,
        onWaitlist,
        isFollowing,
        myReview,
        createdAt: profile.created_at,
        isConnected
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
