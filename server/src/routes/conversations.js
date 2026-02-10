// ============================================================
// Conversation & Message Routes
// ============================================================
// GET  /api/conversations              - List user's conversations
// POST /api/conversations              - Start a new conversation
// GET  /api/conversations/:id/messages - Get messages in a conversation
// POST /api/conversations/:id/messages - Send a message
//
// All routes are protected (require JWT token).
// Replaces: conversations state and message functions in AppContext.jsx
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All conversation routes require authentication
router.use(authenticate)

// ============================================================
// GET /api/conversations
// ============================================================
// Returns all conversations for the logged-in user.
// Includes the other person's name and avatar (via JOIN).
//
// Replaces: conversations state in AppContext.jsx

router.get('/', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.person_id, c.last_message, c.last_time, c.unread_count,
              u.name, u.avatar, u.photo_url
       FROM conversations c
       JOIN users u ON u.id = c.person_id
       WHERE c.owner_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    )

    const conversations = result.rows.map(row => ({
      id: row.id,
      personId: row.person_id,
      name: row.name,
      avatar: row.avatar,
      photoUrl: row.photo_url,
      last: row.last_message || 'Tap to start a conversation',
      time: row.last_time || 'Now',
      unread: row.unread_count
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
// If a conversation already exists with that person, returns it.
//
// Request body: { personId: 2 }
// Replaces: startNewConversation() in AppContext.jsx

router.post('/', async (req, res, next) => {
  try {
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

    const person = personResult.rows[0]

    // Check if conversation already exists
    const existing = await pool.query(
      'SELECT id FROM conversations WHERE owner_id = $1 AND person_id = $2',
      [req.user.id, personId]
    )

    if (existing.rows.length > 0) {
      // Return the existing conversation
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

    // Create new conversation
    const result = await pool.query(
      `INSERT INTO conversations (owner_id, person_id, last_time)
       VALUES ($1, $2, 'Now')
       RETURNING id`,
      [req.user.id, personId]
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
// Returns all messages in a conversation.
// Only the conversation owner can read messages.
//
// Replaces: selectedConversation.msgs in AppContext.jsx

router.get('/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params

    // Verify this conversation belongs to the logged-in user
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND owner_id = $2',
      [id, req.user.id]
    )
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' })
    }

    // Get all messages, ordered by time
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
      own: row.sender_id === req.user.id
    }))

    // Mark as read (reset unread count)
    await pool.query(
      'UPDATE conversations SET unread_count = 0 WHERE id = $1',
      [id]
    )

    res.json({ messages })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/conversations/:id/messages
// ============================================================
// Sends a message in a conversation.
// Updates the conversation's last_message and last_time.
//
// Request body: { text: "Hello!" }
// Replaces: sendMessage() in AppContext.jsx

router.post('/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const { text } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required.' })
    }

    // Verify this conversation belongs to the logged-in user
    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND owner_id = $2',
      [id, req.user.id]
    )
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' })
    }

    // Insert the message
    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [id, req.user.id, text.trim()]
    )

    const msg = result.rows[0]

    // Update the conversation's last message preview
    await pool.query(
      `UPDATE conversations
       SET last_message = $1, last_time = 'Just now', updated_at = NOW()
       WHERE id = $2`,
      [text.trim(), id]
    )

    // Get the sender's name for the response
    const userResult = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [req.user.id]
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
