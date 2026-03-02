// ============================================================
// Guide Follows Routes
// ============================================================
// POST   /api/follows/:guideId  - Follow a guide (one-tap, no approval)
// DELETE /api/follows/:guideId  - Unfollow a guide
// GET    /api/follows/:guideId  - Check follow status + follower count

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// POST /api/follows/:guideId — follow a guide
router.post('/:guideId', async (req, res) => {
  const followerId = req.user.id
  const guideId = parseInt(req.params.guideId, 10)

  if (followerId === guideId) {
    return res.status(400).json({ error: 'You cannot follow yourself.' })
  }

  try {
    // Verify the target user is actually a guide
    const guideCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND role = $2',
      [guideId, 'guide']
    )
    if (guideCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Guide not found.' })
    }

    // INSERT ON CONFLICT DO NOTHING — idempotent
    const result = await pool.query(
      `INSERT INTO guide_follows (follower_id, guide_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, guide_id) DO NOTHING
       RETURNING id`,
      [followerId, guideId]
    )

    if (result.rows.length > 0) {
      // New follow — increment denormalized count
      await pool.query(
        'UPDATE users SET follower_count = follower_count + 1 WHERE id = $1',
        [guideId]
      )
    }

    const countResult = await pool.query(
      'SELECT follower_count FROM users WHERE id = $1',
      [guideId]
    )

    res.json({ following: true, followerCount: countResult.rows[0].follower_count })
  } catch (err) {
    console.error('Follow error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

// DELETE /api/follows/:guideId — unfollow a guide
router.delete('/:guideId', async (req, res) => {
  const followerId = req.user.id
  const guideId = parseInt(req.params.guideId, 10)

  try {
    const result = await pool.query(
      `DELETE FROM guide_follows WHERE follower_id = $1 AND guide_id = $2 RETURNING id`,
      [followerId, guideId]
    )

    if (result.rows.length > 0) {
      // Row deleted — decrement count (floor at 0)
      await pool.query(
        'UPDATE users SET follower_count = GREATEST(follower_count - 1, 0) WHERE id = $1',
        [guideId]
      )
    }

    const countResult = await pool.query(
      'SELECT follower_count FROM users WHERE id = $1',
      [guideId]
    )

    res.json({ following: false, followerCount: countResult.rows[0]?.follower_count ?? 0 })
  } catch (err) {
    console.error('Unfollow error:', err)
    res.status(500).json({ error: 'Server error.' })
  }
})

export default router
