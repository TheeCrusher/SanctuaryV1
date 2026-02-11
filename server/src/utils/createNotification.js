// =============================================================================
// CREATE NOTIFICATION HELPER
// =============================================================================
// Shared utility used by all route files to create notifications.
// Handles: DB insert, self-notify guard, block guard, Socket.io push.
//
// Usage in any route:
//   import { createNotification } from '../utils/createNotification.js'
//   const io = req.app.get('io')
//   await createNotification(io, { userId, actorId, type, title, body, referenceType, referenceId })

import pool from '../config/db.js'

export async function createNotification(io, {
  userId,
  actorId,
  type,
  title,
  body,
  referenceType,
  referenceId
}) {
  // Guard: never notify yourself
  if (userId === actorId) return null

  // Guard: don't notify if blocked (bidirectional)
  if (actorId) {
    const blockCheck = await pool.query(
      `SELECT id FROM user_blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)`,
      [userId, actorId]
    )
    if (blockCheck.rows.length > 0) return null
  }

  // Insert notification row
  const result = await pool.query(
    `INSERT INTO notifications (user_id, actor_id, type, title, body, reference_type, reference_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [userId, actorId || null, type, title, body || null, referenceType || null, referenceId || null]
  )

  const notification = result.rows[0]

  // Get updated unread count for badge
  const countResult = await pool.query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  )

  // Push to recipient via Socket.io if they're online
  if (io) {
    io.to(`user:${userId}`).emit('new_notification', {
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        referenceType: notification.reference_type,
        referenceId: notification.reference_id,
        actorId: notification.actor_id,
        isRead: notification.is_read,
        createdAt: notification.created_at
      },
      unreadCount: countResult.rows[0].count
    })
  }

  return notification
}
