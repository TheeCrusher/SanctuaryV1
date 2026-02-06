// ============================================================
// Church Favorites Routes
// ============================================================
// GET    /api/favorites            - List favorite church IDs
// POST   /api/favorites/:churchId  - Add a church to favorites
// DELETE /api/favorites/:churchId  - Remove from favorites
//
// All routes are protected (require JWT token).
// Maps to: AppContext.jsx → favoriteChurchIds state
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All favorites routes require authentication
router.use(authenticate)

// ============================================================
// GET /api/favorites
// ============================================================
// Returns an array of church IDs the user has favorited.

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT church_id FROM church_favorites WHERE user_id = $1',
      [req.user.id]
    )
    const favoriteIds = result.rows.map(r => r.church_id)
    res.json({ favoriteIds })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/favorites/:churchId
// ============================================================
// Adds a church to the user's favorites.
// ON CONFLICT DO NOTHING prevents duplicate entries.

router.post('/:churchId', async (req, res, next) => {
  try {
    await pool.query(
      `INSERT INTO church_favorites (user_id, church_id) VALUES ($1, $2)
       ON CONFLICT (user_id, church_id) DO NOTHING`,
      [req.user.id, req.params.churchId]
    )
    res.status(201).json({ success: true })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/favorites/:churchId
// ============================================================
// Removes a church from the user's favorites.

router.delete('/:churchId', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM church_favorites WHERE user_id = $1 AND church_id = $2',
      [req.user.id, req.params.churchId]
    )
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
