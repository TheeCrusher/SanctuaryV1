// ============================================================
// Church Reviews Routes
// ============================================================
// GET    /api/churches/:id/reviews  - List reviews for a church
// POST   /api/churches/:id/reviews  - Submit a review
// PUT    /api/churches/:id/reviews  - Update own review
// DELETE /api/churches/:id/reviews  - Delete own review

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

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
       ORDER BY r.created_at DESC`,
      [req.params.id]
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

export default router
