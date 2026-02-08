// ============================================================
// Community Routes
// ============================================================
// GET    /api/community              - Get your community (accepted connections)
// GET    /api/community/pending      - Get pending requests (incoming + outgoing)
// GET    /api/community/status/:userId - Check connection status with a user
// POST   /api/community/request      - Send a connection request
// PATCH  /api/community/:id          - Accept or decline a request
// DELETE /api/community/:id          - Remove a connection
//
// All routes are protected (require JWT token).

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Helper: format a user row for the frontend
function formatUser(row) {
  return {
    id: row.id,
    connectionId: row.connection_id,
    name: row.name,
    avatar: row.avatar,
    photoUrl: row.photo_url,
    role: row.role === 'guide' ? 'Guide' : row.role === 'admin' ? 'Admin' : 'Seeker',
    denomination: row.denomination || null,
    churchName: row.church_name || null,
    interests: row.interests || []
  }
}

// ============================================================
// GET /api/community
// ============================================================
// Returns all accepted connections for the logged-in user.
// Joins with users table to get full profile info.
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT
        u.id, uc.id AS connection_id, u.name, u.avatar, u.photo_url,
        u.role, u.denomination, u.church_name, u.interests
       FROM user_connections uc
       JOIN users u ON (
         CASE
           WHEN uc.requester_id = $1 THEN u.id = uc.recipient_id
           ELSE u.id = uc.requester_id
         END
       )
       WHERE (uc.requester_id = $1 OR uc.recipient_id = $1)
         AND uc.status = 'accepted'
       ORDER BY u.name ASC`,
      [userId]
    )

    const community = result.rows.map(formatUser)
    res.json({ community })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/community/pending
// ============================================================
// Returns pending requests: both incoming (others → you) and outgoing (you → others).
router.get('/pending', async (req, res, next) => {
  try {
    const userId = req.user.id

    // Incoming requests (where you are the recipient)
    const incoming = await pool.query(
      `SELECT
        u.id, uc.id AS connection_id, u.name, u.avatar, u.photo_url,
        u.role, u.denomination, u.church_name, u.interests
       FROM user_connections uc
       JOIN users u ON u.id = uc.requester_id
       WHERE uc.recipient_id = $1 AND uc.status = 'pending'
       ORDER BY uc.created_at DESC`,
      [userId]
    )

    // Outgoing requests (where you are the requester)
    const outgoing = await pool.query(
      `SELECT
        u.id, uc.id AS connection_id, u.name, u.avatar, u.photo_url,
        u.role, u.denomination, u.church_name, u.interests
       FROM user_connections uc
       JOIN users u ON u.id = uc.recipient_id
       WHERE uc.requester_id = $1 AND uc.status = 'pending'
       ORDER BY uc.created_at DESC`,
      [userId]
    )

    res.json({
      incoming: incoming.rows.map(formatUser),
      outgoing: outgoing.rows.map(formatUser)
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/community/status/:userId
// ============================================================
// Check the connection status between logged-in user and another user.
// Returns: 'none', 'pending_sent', 'pending_received', 'accepted'
router.get('/status/:userId', async (req, res, next) => {
  try {
    const myId = req.user.id
    const theirId = Number(req.params.userId)

    if (myId === theirId) {
      return res.json({ status: 'self' })
    }

    const result = await pool.query(
      `SELECT id, requester_id, status
       FROM user_connections
       WHERE (requester_id = $1 AND recipient_id = $2)
          OR (requester_id = $2 AND recipient_id = $1)
       LIMIT 1`,
      [myId, theirId]
    )

    if (result.rows.length === 0) {
      return res.json({ status: 'none', connectionId: null })
    }

    const conn = result.rows[0]

    if (conn.status === 'accepted') {
      return res.json({ status: 'accepted', connectionId: conn.id })
    }

    if (conn.status === 'declined') {
      return res.json({ status: 'none', connectionId: null })
    }

    // Pending — determine direction
    const direction = conn.requester_id === myId ? 'pending_sent' : 'pending_received'
    return res.json({ status: direction, connectionId: conn.id })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/community/request
// ============================================================
// Send a connection request to another user.
// Body: { recipientId }
router.post('/request', async (req, res, next) => {
  try {
    const requesterId = req.user.id
    const { recipientId } = req.body

    if (!recipientId) {
      return res.status(400).json({ error: 'recipientId is required.' })
    }

    if (requesterId === recipientId) {
      return res.status(400).json({ error: 'Cannot connect with yourself.' })
    }

    // Check if recipient exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [recipientId])
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }

    // Check if a connection already exists (in either direction)
    const existing = await pool.query(
      `SELECT id, status FROM user_connections
       WHERE (requester_id = $1 AND recipient_id = $2)
          OR (requester_id = $2 AND recipient_id = $1)`,
      [requesterId, recipientId]
    )

    if (existing.rows.length > 0) {
      const conn = existing.rows[0]
      if (conn.status === 'accepted') {
        return res.status(400).json({ error: 'Already connected.' })
      }
      if (conn.status === 'pending') {
        return res.status(400).json({ error: 'Request already pending.' })
      }
      // If declined, allow re-requesting by updating the existing row
      if (conn.status === 'declined') {
        const result = await pool.query(
          `UPDATE user_connections
           SET requester_id = $1, recipient_id = $2, status = 'pending', updated_at = NOW()
           WHERE id = $3
           RETURNING id`,
          [requesterId, recipientId, conn.id]
        )
        return res.status(201).json({ connectionId: result.rows[0].id, status: 'pending' })
      }
    }

    // Create new connection request
    const result = await pool.query(
      `INSERT INTO user_connections (requester_id, recipient_id, status)
       VALUES ($1, $2, 'pending')
       RETURNING id`,
      [requesterId, recipientId]
    )

    res.status(201).json({ connectionId: result.rows[0].id, status: 'pending' })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PATCH /api/community/:id
// ============================================================
// Accept or decline a pending connection request.
// Only the recipient can accept/decline.
// Body: { status: 'accepted' | 'declined' }
router.patch('/:id', async (req, res, next) => {
  try {
    const connectionId = req.params.id
    const userId = req.user.id
    const { status } = req.body

    if (!status || !['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "accepted" or "declined".' })
    }

    // Only the recipient can accept/decline
    const result = await pool.query(
      `UPDATE user_connections
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND recipient_id = $3 AND status = 'pending'
       RETURNING id`,
      [status, connectionId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending request not found.' })
    }

    res.json({ connectionId: result.rows[0].id, status })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/community/:id
// ============================================================
// Remove a connection. Either party can remove it.
router.delete('/:id', async (req, res, next) => {
  try {
    const connectionId = req.params.id
    const userId = req.user.id

    const result = await pool.query(
      `DELETE FROM user_connections
       WHERE id = $1 AND (requester_id = $2 OR recipient_id = $2)
       RETURNING id`,
      [connectionId, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection not found.' })
    }

    res.json({ removed: true })
  } catch (error) {
    next(error)
  }
})

export default router
