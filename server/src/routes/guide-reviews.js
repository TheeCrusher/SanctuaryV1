// ============================================================
// Guide Reviews Routes
// ============================================================
// GET    /api/guide-reviews/guide/:guideId - All reviews for a guide
// POST   /api/guide-reviews/guide/:guideId - Create/update own review (seeker only)
// DELETE /api/guide-reviews/guide/:guideId - Delete own review

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// ---- Helper: recalculate and store aggregate rating on users table ----
async function recalculateGuideRating(guideId) {
  const r = await pool.query(
    `SELECT COUNT(*)::int AS count,
            COALESCE(AVG(rating), 0)::decimal(3,2) AS avg
     FROM guide_reviews WHERE guide_id = $1`,
    [guideId]
  )
  await pool.query(
    `UPDATE users SET overall_rating = $1, review_count = $2 WHERE id = $3`,
    [r.rows[0].avg, r.rows[0].count, guideId]
  )
}

// GET /api/guide-reviews/guide/:guideId — all reviews for a guide
router.get('/guide/:guideId', async (req, res) => {
  const currentUserId = req.user.id
  const guideId = parseInt(req.params.guideId, 10)

  try {
    const result = await pool.query(
      `SELECT
         gr.id, gr.guide_id, gr.seeker_id, gr.appointment_id,
         gr.rating, gr.review_text, gr.created_at, gr.updated_at,
         u.name AS seeker_name, u.avatar AS seeker_avatar, u.photo_url AS seeker_photo
       FROM guide_reviews gr
       JOIN users u ON u.id = gr.seeker_id
       WHERE gr.guide_id = $1
       ORDER BY gr.created_at DESC`,
      [guideId]
    )

    const reviews = result.rows.map(r => ({
      id: r.id,
      guideId: r.guide_id,
      seekerId: r.seeker_id,
      appointmentId: r.appointment_id,
      rating: r.rating,
      reviewText: r.review_text,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      seekerName: r.seeker_name,
      seekerAvatar: r.seeker_avatar,
      seekerPhoto: r.seeker_photo,
      isOwn: r.seeker_id === currentUserId,
    }))

    res.json({ reviews })
  } catch (err) {
    console.error('Get reviews error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// POST /api/guide-reviews/guide/:guideId — create or update own review (seeker only)
router.post('/guide/:guideId', async (req, res) => {
  const seekerId = req.user.id
  const guideId = parseInt(req.params.guideId, 10)
  const { rating, reviewText, appointmentId } = req.body

  // Fetch role from DB (auth middleware only provides id)
  const seekerCheck = await pool.query('SELECT role FROM users WHERE id = $1', [seekerId])
  if (seekerCheck.rows[0]?.role !== 'seeker') {
    return res.status(403).json({ error: 'Only seekers can leave reviews.' })
  }
  if (seekerId === guideId) {
    return res.status(400).json({ error: 'You cannot review yourself.' })
  }
  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
    return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' })
  }

  try {
    // Verify guide exists
    const guideCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [guideId, 'guide']
    )
    if (guideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Guide not found.' })
    }

    // UPSERT — one review per guide-seeker pair, updateable
    const result = await pool.query(
      `INSERT INTO guide_reviews (guide_id, seeker_id, appointment_id, rating, review_text, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (guide_id, seeker_id) DO UPDATE
         SET rating = EXCLUDED.rating,
             review_text = EXCLUDED.review_text,
             appointment_id = COALESCE(EXCLUDED.appointment_id, guide_reviews.appointment_id),
             updated_at = NOW()
       RETURNING id, created_at, updated_at`,
      [guideId, seekerId, appointmentId || null, Number(rating), reviewText?.trim() || null]
    )

    await recalculateGuideRating(guideId)

    // Fetch updated guide stats
    const statsResult = await pool.query(
      'SELECT overall_rating, review_count FROM users WHERE id = $1',
      [guideId]
    )

    res.status(201).json({
      review: {
        id: result.rows[0].id,
        guideId,
        seekerId,
        rating: Number(rating),
        reviewText: reviewText?.trim() || null,
        createdAt: result.rows[0].created_at,
        updatedAt: result.rows[0].updated_at,
      },
      guideStats: {
        overallRating: parseFloat(statsResult.rows[0].overall_rating),
        reviewCount: statsResult.rows[0].review_count,
      }
    })
  } catch (err) {
    console.error('Create review error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// DELETE /api/guide-reviews/guide/:guideId — delete own review
router.delete('/guide/:guideId', async (req, res) => {
  const seekerId = req.user.id
  const guideId = parseInt(req.params.guideId, 10)

  try {
    const result = await pool.query(
      `DELETE FROM guide_reviews WHERE guide_id = $1 AND seeker_id = $2 RETURNING id`,
      [guideId, seekerId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' })
    }

    await recalculateGuideRating(guideId)

    res.status(204).send()
  } catch (err) {
    console.error('Delete review error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

export default router
