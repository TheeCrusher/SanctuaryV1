// ============================================================
// Conversation & Message Routes (Bidirectional)
// ============================================================
// GET  /api/conversations              - List user's conversations
// POST /api/conversations              - Start a new conversation
// GET  /api/conversations/:id/messages - Get messages in a conversation
// POST /api/conversations/:id/messages - Send a message
//
// Conversations are SHARED between two users. One row per pair.
// Both owner_id and person_id can read and send messages.
// last_sender_id tracks who sent the last message for unread logic.
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// ============================================================
// GET /api/conversations
// ============================================================
// Returns all conversations where the logged-in user is EITHER
// owner_id or person_id. Shows the OTHER person's info.

router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT
         c.id,
         c.owner_id,
         c.person_id,
         c.last_message,
         c.last_time,
         c.last_sender_id,
         c.unread_count,
         -- Get the OTHER person's info
         CASE WHEN c.owner_id = $1 THEN c.person_id ELSE c.owner_id END AS other_id,
         u.name,
         u.avatar,
         u.photo_url
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.owner_id = $1 THEN c.person_id ELSE c.owner_id END
       WHERE (c.owner_id = $1 OR c.person_id = $1)
         AND CASE WHEN c.owner_id = $1 THEN c.person_id ELSE c.owner_id END NOT IN (
           SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
         )
       ORDER BY c.updated_at DESC`,
      [userId]
    )

    const conversations = result.rows.map(row => ({
      id: row.id,
      personId: row.other_id,
      name: row.name,
      avatar: row.avatar,
      photoUrl: row.photo_url,
      last: row.last_message || 'Tap to start a conversation',
      time: row.last_time || 'Now',
      // Only show unread if the OTHER person sent the last message
      unread: row.last_sender_id && row.last_sender_id !== userId ? row.unread_count : 0
    }))

    res.json({ conversations })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/conversations
// ============================================================
// Starts a new conversation with another user.
// Checks BOTH directions so only ONE conversation exists per pair.

router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id
    const { personId } = req.body

    if (!personId) {
      return res.status(400).json({ error: 'personId is required.' })
    }

    // Check if the person exists
    const personResult = await pool.query(
      'SELECT id, name, avatar, photo_url FROM users WHERE id = $1',
      [personId]
    )
    if (personResult.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found.' })
    }

    // Check if either user has blocked the other
    const blockCheck = await pool.query(
      `SELECT id FROM user_blocks
       WHERE (blocker_id = $1 AND blocked_id = $2)
          OR (blocker_id = $2 AND blocked_id = $1)`,
      [userId, personId]
    )
    if (blockCheck.rows.length > 0) {
      return res.status(404).json({ error: 'Person not found.' })
    }

    const person = personResult.rows[0]

    // Check BOTH directions for existing conversation
    const existing = await pool.query(
      `SELECT id FROM conversations
       WHERE (owner_id = $1 AND person_id = $2)
          OR (owner_id = $2 AND person_id = $1)`,
      [userId, personId]
    )

    if (existing.rows.length > 0) {
      const convId = existing.rows[0].id
      return res.json({
        conversation: {
          id: convId,
          personId: person.id,
          name: person.name,
          avatar: person.avatar,
          photoUrl: person.photo_url,
          last: 'Tap to start a conversation',
          time: 'Now',
          unread: 0,
          msgs: []
        }
      })
    }

    // Create new conversation (one row for the pair)
    const result = await pool.query(
      `INSERT INTO conversations (owner_id, person_id, last_time)
       VALUES ($1, $2, 'Now')
       RETURNING id`,
      [userId, personId]
    )

    res.status(201).json({
      conversation: {
        id: result.rows[0].id,
        personId: person.id,
        name: person.name,
        avatar: person.avatar,
        photoUrl: person.photo_url,
        last: 'Tap to start a conversation',
        time: 'Now',
        unread: 0,
        msgs: []
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/conversations/:id/messages
// ============================================================
// Returns all messages. Either participant can read.
// Resets unread if the reader is NOT the last sender.

router.get('/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Verify this user is a participant (either side)
    const convCheck = await pool.query(
      'SELECT id, last_sender_id FROM conversations WHERE id = $1 AND (owner_id = $2 OR person_id = $2)',
      [id, userId]
    )
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' })
    }

    // Get all messages
    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.text, m.created_at, u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [id]
    )

    const messages = result.rows.map(row => ({
      id: row.id,
      sender: row.sender_name,
      text: row.text,
      time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      own: row.sender_id === userId
    }))

    // Reset unread only if the other person sent the last messages
    const lastSenderId = convCheck.rows[0].last_sender_id
    if (lastSenderId && lastSenderId !== userId) {
      await pool.query(
        'UPDATE conversations SET unread_count = 0 WHERE id = $1',
        [id]
      )
    }

    res.json({ messages })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/conversations/:id/messages
// ============================================================
// Send a message. Either participant can send.
// Updates last_message, last_time, last_sender_id, unread_count.

router.post('/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { text } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required.' })
    }

    // Verify this user is a participant (either side)
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND (owner_id = $2 OR person_id = $2)',
      [id, userId]
    )
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' })
    }

    // Insert the message
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [id, userId, text.trim()]
    )

    const msg = result.rows[0]

    // Update conversation: last message preview + track who sent it + increment unread
    await pool.query(
      `UPDATE conversations
       SET last_message = $1,
           last_time = 'Just now',
           last_sender_id = $2,
           unread_count = unread_count + 1,
           updated_at = NOW()
       WHERE id = $3`,
      [text.trim(), userId, id]
    )

    // Get sender name for response
    const userResult = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    )

    res.status(201).json({
      message: {
        id: msg.id,
        sender: userResult.rows[0].name,
        text: text.trim(),
        time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        own: true
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
