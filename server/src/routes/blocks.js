// ============================================================
// Block Routes
// ============================================================
// POST   /api/blocks        - Block a user
// DELETE /api/blocks/:userId - Unblock a user
// GET    /api/blocks        - List blocked users
//
// All routes are protected (require JWT token).
// Blocking is bidirectional: if A blocks B, both become invisible
// to each other across the entire app.

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// POST /api/blocks
// Block a user. Also removes any existing connection between the two.
router.post('/', async (req, res, next) => {
  try {
    const blockerId = req.user.id
    const { blockedId } = req.body

    if (!blockedId) {
      return res.status(400).json({ error: 'blockedId is required.' })
    }

    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Cannot block yourself.' })
    }

    // Check if user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [blockedId])
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Insert the block (ignore if already blocked)
    await pool.query(
      `INSERT INTO user_blocks (blocker_id, blocked_id)
       VALUES ($1, $2)
       ON CONFLICT (blocker_id, blocked_id) DO NOTHING`,
      [blockerId, blockedId]
    )

    // Remove any existing connection between the two users
    await pool.query(
      `DELETE FROM user_connections
       WHERE (requester_id = $1 AND recipient_id = $2)
          OR (requester_id = $2 AND recipient_id = $1)`,
      [blockerId, blockedId]
    )

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/blocks/:userId
// Unblock a user.
router.delete('/:userId', async (req, res, next) => {
  try {
    const blockerId = req.user.id
    const blockedId = Number(req.params.userId)

    const result = await pool.query(
      'DELETE FROM user_blocks WHERE blocker_id = $1 AND blocked_id = $2 RETURNING id',
      [blockerId, blockedId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Block not found.' })
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// GET /api/blocks
// List all users the current user has blocked.
router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.avatar, u.photo_url, u.role, ub.created_at AS blocked_at
       FROM user_blocks ub
       JOIN users u ON u.id = ub.blocked_id
       WHERE ub.blocker_id = $1
       ORDER BY ub.created_at DESC`,
      [req.user.id]
    )

    const blocked = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      photoUrl: row.photo_url,
      role: row.role.charAt(0).toUpperCase() + row.role.slice(1),
      blockedAt: row.blocked_at
    }))

    res.json({ blocked })
  } catch (error) {
    next(error)
  }
})

export default router
