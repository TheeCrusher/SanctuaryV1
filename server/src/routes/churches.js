// ============================================================
// Church Routes (includes Reviews & Announcements)
// ============================================================
// GET    /api/churches                          - List all churches (with optional search)
// GET    /api/churches/:id                      - Get a single church's details
// GET    /api/churches/:id/members              - Get people at this church
// GET    /api/churches/:id/reviews              - List reviews for a church
// POST   /api/churches/:id/reviews              - Submit a review
// PUT    /api/churches/:id/reviews              - Update own review
// DELETE /api/churches/:id/reviews              - Delete own review
// GET    /api/churches/:id/announcements        - Get bulletin board announcements
// POST   /api/churches/:id/announcements        - Create announcement (guides only)
// DELETE /api/churches/:id/announcements/:annId - Delete announcement (author only)
//
// All routes are protected (require JWT token).
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All church routes require authentication
router.use(authenticate)

// Helper: transform a database row to match the frontend's expected format
// The frontend expects nested ratings: { singing: 4.5, preaching: 5.0, ... }
// But in the database, these are flat columns: rating_singing, rating_preaching, etc.
function formatChurch(row) {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    phone: row.phone,
    website: row.website,
    shortDescription: row.short_description,
    photoUrl: row.photo_url,
    sundaySchool: row.sunday_school,
    recommendedAges: row.recommended_ages,
    hours: row.hours,
    ratings: {
      singing: parseFloat(row.rating_singing),
      preaching: parseFloat(row.rating_preaching),
      openness: parseFloat(row.rating_openness),
      space: parseFloat(row.rating_space)
    },
    overallRating: parseFloat(row.overall_rating),
    reviewCount: row.review_count,
    rated: true
  }
}

// ============================================================
// GET /api/churches
// ============================================================
// Returns churches with pagination. Supports search by name,
// city, state, or ZIP code.
//
// Query params:
//   ?q=       - Search term (filters by name, city, state, or zip)
//   ?limit=   - How many to return (default 5)
//   ?offset=  - How many to skip (default 0, used for "show more")
//
// Response includes { churches, hasMore, total } so the frontend
// knows whether to show a "Show More" button.

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query
    const limit = parseInt(req.query.limit) || 5
    const offset = parseInt(req.query.offset) || 0

    let baseQuery = 'FROM churches'
    const params = []

    if (q) {
      // Search by city, state (case-insensitive), ZIP code, or church name
      baseQuery += ' WHERE city ILIKE $1 OR state ILIKE $2 OR zip LIKE $3 OR name ILIKE $4'
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
    }

    // Get total count of matching churches
    const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params)
    const total = parseInt(countResult.rows[0].count)

    // Get the paginated results
    const dataParams = [...params, limit, offset]
    const result = await pool.query(
      `SELECT * ${baseQuery} ORDER BY (photo_url IS NULL) ASC, name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      dataParams
    )
    const churches = result.rows.map(formatChurch)

    res.json({
      churches,
      total,
      hasMore: offset + churches.length < total
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/churches/:id
// ============================================================
// Returns a single church by ID.
//
// Replaces: allChurches.find(c => c.id === ...) in ChurchDetail screen

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query('SELECT * FROM churches WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Church not found.' })
    }

    res.json({ church: formatChurch(result.rows[0]) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/churches/:id/members
// ============================================================
// Returns users who have favorited OR reviewed this church.
// Excludes the current user and already-connected users.
// Returns limited fields + shared interests count.

router.get('/:id/members', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Get current user's interests for shared count
    const meResult = await pool.query('SELECT interests FROM users WHERE id = $1', [userId])
    const myInterests = meResult.rows[0]?.interests || []

    // Find users who favorited or reviewed this church, excluding:
    // - the current user
    // - users already connected (accepted) or pending with current user
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.avatar, u.photo_url, u.role, u.interests
      FROM users u
      WHERE u.id != $1
        AND (
          u.id IN (SELECT user_id FROM church_favorites WHERE church_id = $2)
          OR u.id IN (SELECT user_id FROM church_reviews WHERE church_id = $2)
        )
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
    `, [userId, id])

    const members = result.rows.map(row => {
      const theirInterests = row.interests || []
      const sharedCount = myInterests.filter(i => theirInterests.includes(i)).length
      return {
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        photoUrl: row.photo_url,
        role: row.role.charAt(0).toUpperCase() + row.role.slice(1),
        sharedInterests: sharedCount
      }
    })

    res.json({ members })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// REVIEWS
// ============================================================

// Helper: recalculate a church's overall rating from reviews
async function recalculateChurchRating(churchId) {
  const result = await pool.query(
    `SELECT COALESCE(AVG(rating), 0) as avg_rating, COUNT(*) as review_count
     FROM church_reviews WHERE church_id = $1`,
    [churchId]
  )
  const { avg_rating, review_count } = result.rows[0]
  await pool.query(
    'UPDATE churches SET overall_rating = $1, review_count = $2 WHERE id = $3',
    [parseFloat(avg_rating).toFixed(1), parseInt(review_count), churchId]
  )
}

// GET /api/churches/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at, r.updated_at,
              r.user_id, u.name as user_name, u.avatar as user_avatar, u.photo_url as user_photo
       FROM church_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.church_id = $1
         AND u.id NOT IN (
           SELECT blocked_id FROM user_blocks WHERE blocker_id = $2
           UNION
           SELECT blocker_id FROM user_blocks WHERE blocked_id = $2
         )
       ORDER BY r.created_at DESC`,
      [req.params.id, req.user.id]
    )

    const reviews = result.rows.map(r => ({
      id: r.id,
      rating: r.rating,
      text: r.review_text,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      userId: r.user_id,
      userName: r.user_name,
      userAvatar: r.user_avatar,
      userPhoto: r.user_photo
    }))

    res.json({ reviews })
  } catch (error) {
    next(error)
  }
})

// POST /api/churches/:id/reviews
router.post('/:id/reviews', async (req, res, next) => {
  try {
    const { rating, text } = req.body
    const churchId = req.params.id

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' })
    }

    const result = await pool.query(
      `INSERT INTO church_reviews (user_id, church_id, rating, review_text)
       VALUES ($1, $2, $3, $4)
       RETURNING id, rating, review_text, created_at`,
      [req.user.id, churchId, rating, text || null]
    )

    await recalculateChurchRating(churchId)

    const r = result.rows[0]
    res.status(201).json({
      review: {
        id: r.id,
        rating: r.rating,
        text: r.review_text,
        createdAt: r.created_at
      }
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'You have already reviewed this church.' })
    }
    next(error)
  }
})

// PUT /api/churches/:id/reviews
router.put('/:id/reviews', async (req, res, next) => {
  try {
    const { rating, text } = req.body
    const churchId = req.params.id

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' })
    }

    const result = await pool.query(
      `UPDATE church_reviews SET rating = $1, review_text = $2, updated_at = NOW()
       WHERE user_id = $3 AND church_id = $4
       RETURNING id, rating, review_text, created_at, updated_at`,
      [rating, text || null, req.user.id, churchId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' })
    }

    await recalculateChurchRating(churchId)

    const r = result.rows[0]
    res.json({
      review: {
        id: r.id,
        rating: r.rating,
        text: r.review_text,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/churches/:id/reviews
router.delete('/:id/reviews', async (req, res, next) => {
  try {
    const churchId = req.params.id
    const result = await pool.query(
      'DELETE FROM church_reviews WHERE user_id = $1 AND church_id = $2 RETURNING id',
      [req.user.id, churchId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' })
    }

    await recalculateChurchRating(churchId)

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// ANNOUNCEMENTS
// ============================================================

// GET /api/churches/:id/announcements
// Returns bulletin board announcements for a church, newest first.

router.get('/:id/announcements', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT ca.id, ca.title, ca.message, ca.category, ca.created_at,
             u.name AS author_name, u.avatar AS author_avatar, u.photo_url AS author_photo
      FROM church_announcements ca
      JOIN users u ON u.id = ca.author_id
      WHERE ca.church_id = $1
      ORDER BY ca.created_at DESC
    `, [req.params.id])

    const announcements = result.rows.map(r => ({
      id: r.id,
      title: r.title,
      message: r.message,
      category: r.category,
      createdAt: r.created_at,
      authorName: r.author_name,
      authorAvatar: r.author_avatar,
      authorPhoto: r.author_photo
    }))

    res.json({ announcements })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/churches/:id/announcements
// ============================================================
// Create a new announcement (guides only).

const VALID_ANNOUNCEMENT_CATEGORIES = ['Announcement', 'Upcoming Sermon', 'Schedule Change', 'Church Need', 'Event']

router.post('/:id/announcements', async (req, res, next) => {
  try {
    if (req.user.role !== 'guide') {
      return res.status(403).json({ error: 'Only guides can post announcements.' })
    }

    const { title, message, category } = req.body

    if (!title || !message || !category) {
      return res.status(400).json({ error: 'Title, message, and category are required.' })
    }

    if (!VALID_ANNOUNCEMENT_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid announcement category.' })
    }

    const result = await pool.query(
      `INSERT INTO church_announcements (church_id, author_id, title, message, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, message, category, created_at`,
      [req.params.id, req.user.id, title, message, category]
    )

    const r = result.rows[0]
    res.status(201).json({
      announcement: {
        id: r.id,
        title: r.title,
        message: r.message,
        category: r.category,
        createdAt: r.created_at,
        authorName: req.user.name,
        authorAvatar: req.user.avatar,
        authorPhoto: req.user.photoUrl
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/churches/:id/announcements/:annId
// ============================================================
// Delete an announcement (author only).

router.delete('/:id/announcements/:annId', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM church_announcements WHERE id = $1 AND author_id = $2 RETURNING id',
      [req.params.annId, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found or not yours.' })
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
