// ============================================================
// Church Routes
// ============================================================
// GET /api/churches       - List all churches (with optional search)
// GET /api/churches/:id   - Get a single church's details
//
// All routes are protected (require JWT token).
// Replaces: ALL_CHURCHES array and filter logic in AppContext.jsx
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
    zip: row.zip,
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
// Returns all churches. If ?q= is provided, filters by city
// or ZIP code (case-insensitive).
//
// Replaces: the filteredChurches computed value in AppContext.jsx

router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query

    let query = 'SELECT * FROM churches'
    const params = []

    if (q) {
      // Search by city (case-insensitive) or ZIP code
      // ILIKE is PostgreSQL's case-insensitive LIKE
      query += ' WHERE city ILIKE $1 OR zip LIKE $2'
      params.push(`%${q}%`, `%${q}%`)
    }

    query += ' ORDER BY name ASC'

    const result = await pool.query(query, params)
    const churches = result.rows.map(formatChurch)

    res.json({ churches })
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

export default router
