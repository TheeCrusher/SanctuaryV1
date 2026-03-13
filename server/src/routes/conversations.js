// ============================================================
// Conversation & Message Routes (Bidirectional)
// ============================================================
// GET  /api/conversations              - List active conversations
// GET  /api/conversations/requests     - List pending message requests
// POST /api/conversations              - Start a new conversation (checks message_permission)
// POST /api/conversations/:id/accept   - Accept a message request
// POST /api/conversations/:id/decline  - Decline a message request
// GET  /api/conversations/:id/messages - Get messages in a conversation
// POST /api/conversations/:id/messages - Send a message
//
// Message permission logic:
//   recipient.message_permission = 'everyone'     → always active
//   recipient.message_permission = 'connections'  → connected = active, else request
//   recipient.message_permission = 'nobody'       → blocked (403)
//
// Conversation status: 'active' | 'request' | 'declined'
// GET / only returns 'active'. GET /requests returns 'request'.
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'
import { createNotification } from '../utils/createNotification.js'

const router = Router()

router.use(authenticate)

// ============================================================
// GET /api/conversations
// ============================================================
// Returns active conversations only (status = 'active').

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
         CASE WHEN c.owner_id = $1 THEN c.person_id ELSE c.owner_id END AS other_id,
         u.name,
         u.avatar,
         u.photo_url,
         u.preferred_church_id AS other_church_id
       FROM conversations c
       JOIN users u ON u.id = CASE WHEN c.owner_id = $1 THEN c.person_id ELSE c.owner_id END
       WHERE (c.owner_id = $1 OR c.person_id = $1)
         AND COALESCE(c.status, 'active') = 'active'
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
      otherChurchId: row.other_church_id,
      last: row.last_message || 'Tap to start a conversation',
      time: row.last_time || 'Now',
      unread: row.last_sender_id && row.last_sender_id !== userId ? row.unread_count : 0
    }))

    res.json({ conversations })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/conversations/requests
// ============================================================
// Returns conversations with status = 'request' where the
// current user is the RECIPIENT (person_id or owner_id who
// did NOT initiate the request).
// The initiator is always owner_id.

router.get('/requests', async (req, res, next) => {
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
         u.name,
         u.avatar,
         u.photo_url
       FROM conversations c
       JOIN users u ON u.id = c.owner_id
       WHERE c.person_id = $1
         AND c.status = 'request'
         AND c.owner_id NOT IN (
           SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
           UNION
           SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
         )
       ORDER BY c.updated_at DESC`,
      [userId]
    )

    const requests = result.rows.map(row => ({
      id: row.id,
      personId: row.owner_id,
      name: row.name,
      avatar: row.avatar,
      photoUrl: row.photo_url,
      preview: row.last_message || '',
      time: row.last_time || 'Now'
    }))

    res.json({ requests })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/conversations
// ============================================================
// Starts or resumes a conversation. Checks recipient's
// message_permission before creating.

router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id
    const { personId } = req.body

    if (!personId) {
      return res.status(400).json({ error: 'personId is required.' })
    }

    // Get recipient info including permission setting
    const personResult = await pool.query(
      'SELECT id, name, avatar, photo_url, message_permission FROM users WHERE id = $1',
      [personId]
    )
    if (personResult.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found.' })
    }

    // Block check
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
    const permission = person.message_permission || 'everyone'

    // Hard block — nobody allowed
    if (permission === 'nobody') {
      return res.status(403).json({
        error: 'This person is not accepting messages right now.',
        code: 'MSG_PERMISSION_NOBODY'
      })
    }

    // Check for existing conversation (any status)
    const existing = await pool.query(
      `SELECT id, status FROM conversations
       WHERE (owner_id = $1 AND person_id = $2)
          OR (owner_id = $2 AND person_id = $1)`,
      [userId, personId]
    )

    if (existing.rows.length > 0) {
      const conv = existing.rows[0]
      // If declined, allow re-initiation by resetting to request/active
      if (conv.status === 'declined') {
        let newStatus = 'active'
        if (permission === 'connections') {
          const connCheck = await pool.query(
            `SELECT id FROM user_connections
             WHERE ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))
               AND status = 'accepted'`,
            [userId, personId]
          )
          newStatus = connCheck.rows.length > 0 ? 'active' : 'request'
        }
        await pool.query(
          'UPDATE conversations SET status = $1, owner_id = $2, person_id = $3, updated_at = NOW() WHERE id = $4',
          [newStatus, userId, personId, conv.id]
        )
        return res.json({
          conversation: {
            id: conv.id,
            personId: person.id,
            name: person.name,
            avatar: person.avatar,
            photoUrl: person.photo_url,
            status: newStatus,
            last: 'Tap to start a conversation',
            time: 'Now',
            unread: 0,
            msgs: []
          }
        })
      }

      // Return existing conversation as-is
      return res.json({
        conversation: {
          id: conv.id,
          personId: person.id,
          name: person.name,
          avatar: person.avatar,
          photoUrl: person.photo_url,
          status: conv.status,
          last: 'Tap to start a conversation',
          time: 'Now',
          unread: 0,
          msgs: []
        }
      })
    }

    // Determine status for new conversation
    let convStatus = 'active'
    if (permission === 'connections') {
      const connCheck = await pool.query(
        `SELECT id FROM user_connections
         WHERE ((requester_id = $1 AND recipient_id = $2) OR (requester_id = $2 AND recipient_id = $1))
           AND status = 'accepted'`,
        [userId, personId]
      )
      convStatus = connCheck.rows.length > 0 ? 'active' : 'request'
    }

    const result = await pool.query(
      `INSERT INTO conversations (owner_id, person_id, last_time, status)
       VALUES ($1, $2, 'Now', $3)
       RETURNING id`,
      [userId, personId, convStatus]
    )

    // Notify recipient if this is a message request
    if (convStatus === 'request') {
      const senderInfo = await pool.query('SELECT name FROM users WHERE id = $1', [userId])
      const io = req.app.get('io')
      await createNotification(io, {
        userId: personId,
        actorId: userId,
        type: 'new_message',
        title: `${senderInfo.rows[0].name} sent you a message request`,
        body: 'Tap to view and accept or decline.',
        referenceType: 'conversation',
        referenceId: result.rows[0].id
      })
    }

    res.status(201).json({
      conversation: {
        id: result.rows[0].id,
        personId: person.id,
        name: person.name,
        avatar: person.avatar,
        photoUrl: person.photo_url,
        status: convStatus,
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
// POST /api/conversations/:id/accept
// ============================================================
// Accept a message request. Only the recipient (person_id) can accept.

router.post('/:id/accept', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const result = await pool.query(
      `UPDATE conversations
       SET status = 'active', updated_at = NOW()
       WHERE id = $1 AND person_id = $2 AND status = 'request'
       RETURNING id, owner_id`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message request not found.' })
    }

    // Notify sender their request was accepted
    const senderInfo = await pool.query('SELECT name FROM users WHERE id = $1', [userId])
    const io = req.app.get('io')
    await createNotification(io, {
      userId: result.rows[0].owner_id,
      actorId: userId,
      type: 'new_message',
      title: `${senderInfo.rows[0].name} accepted your message request`,
      referenceType: 'conversation',
      referenceId: parseInt(id)
    })

    res.json({ accepted: true, conversationId: parseInt(id) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/conversations/:id/decline
// ============================================================
// Decline a message request. Sender is NOT notified (silent decline).

router.post('/:id/decline', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const result = await pool.query(
      `UPDATE conversations
       SET status = 'declined', updated_at = NOW()
       WHERE id = $1 AND person_id = $2 AND status = 'request'
       RETURNING id`,
      [id, userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message request not found.' })
    }

    res.json({ declined: true })
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

    const convCheck = await pool.query(
      'SELECT id, last_sender_id FROM conversations WHERE id = $1 AND (owner_id = $2 OR person_id = $2)',
      [id, userId]
    )
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' })
    }

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

router.post('/:id/messages', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id
    const { text } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text is required.' })
    }

    const convCheck = await pool.query(
      'SELECT id FROM conversations WHERE id = $1 AND (owner_id = $2 OR person_id = $2)',
      [id, userId]
    )
    if (convCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found.' })
    }

    const result = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, text)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [id, userId, text.trim()]
    )

    const msg = result.rows[0]

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

    const userResult = await pool.query('SELECT name FROM users WHERE id = $1', [userId])

    const convInfo = await pool.query(
      'SELECT owner_id, person_id FROM conversations WHERE id = $1',
      [id]
    )
    const conv = convInfo.rows[0]
    const recipientId = conv.owner_id === userId ? conv.person_id : conv.owner_id
    const io = req.app.get('io')
    await createNotification(io, {
      userId: recipientId,
      actorId: userId,
      type: 'new_message',
      title: `${userResult.rows[0].name} sent you a message`,
      body: text.trim().substring(0, 100),
      referenceType: 'conversation',
      referenceId: parseInt(id)
    })

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
