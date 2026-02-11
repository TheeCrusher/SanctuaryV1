// ============================================================
// Notification Routes
// ============================================================
// GET    /api/notifications              - List notifications (newest first)
// GET    /api/notifications/unread-count  - Unread count for bell badge
// PATCH  /api/notifications/:id/read     - Mark one as read
// PATCH  /api/notifications/read-all     - Mark all as read
// DELETE /api/notifications/:id          - Delete one notification

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
router.use(authenticate)

// ── GET / ── List all notifications for the logged-in user ──────────
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id
    const limit = parseInt(req.query.limit) || 50
    const offset = parseInt(req.query.offset) || 0

    const result = await pool.query(
      `SELECT n.*,
              u.name AS actor_name,
              u.photo_url AS actor_photo_url,
              u.avatar AS actor_avatar
       FROM notifications n
       LEFT JOIN users u ON u.id = n.actor_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    )

    const countResult = await pool.query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    )

    // Map snake_case to camelCase for frontend consistency
    const notifications = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      referenceType: row.reference_type,
      referenceId: row.reference_id,
      actorId: row.actor_id,
      actorName: row.actor_name,
      actorPhotoUrl: row.actor_photo_url,
      actorAvatar: row.actor_avatar,
      isRead: row.is_read,
      createdAt: row.created_at
    }))

    res.json({ notifications, unreadCount: countResult.rows[0].count })
  } catch (error) {
    console.error('Failed to fetch notifications:', error)
    res.status(500).json({ error: 'Failed to fetch notifications' })
  }
})

// ── GET /unread-count ── Just the badge number ──────────────────────
router.get('/unread-count', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    )
    res.json({ count: result.rows[0].count })
  } catch (error) {
    console.error('Failed to fetch unread count:', error)
    res.status(500).json({ error: 'Failed to fetch unread count' })
  }
})

// ── PATCH /:id/read ── Mark a single notification as read ───────────
router.patch('/:id/read', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = true
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Failed to mark notification read:', error)
    res.status(500).json({ error: 'Failed to mark notification read' })
  }
})

// ── PATCH /read-all ── Mark all notifications as read ───────────────
router.patch('/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    )
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to mark all read:', error)
    res.status(500).json({ error: 'Failed to mark all read' })
  }
})

// ── DELETE /:id ── Delete a single notification ─────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Failed to delete notification:', error)
    res.status(500).json({ error: 'Failed to delete notification' })
  }
})

export default router
