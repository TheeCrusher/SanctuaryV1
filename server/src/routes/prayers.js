// ============================================================
// Prayer Request Routes
// ============================================================
// GET    /api/prayers              - List active prayer requests
// POST   /api/prayers              - Create new prayer request
// POST   /api/prayers/:id/pray     - Pray for a request
// GET    /api/prayers/:id/comments - Get comments for a request
// POST   /api/prayers/:id/comments - Add comment
// PATCH  /api/prayers/:id          - Mark as answered (owner only)
// DELETE /api/prayers/:id          - Delete own request

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// GET /api/prayers
router.get('/', async (req, res, next) => {
  try {
    const { category, status } = req.query

    let query = `
      SELECT pr.id, pr.title, pr.description, pr.category, pr.is_anonymous,
             pr.prayer_count, pr.status, pr.created_at, pr.user_id,
             u.name as user_name, u.avatar as user_avatar, u.photo_url as user_photo,
             (SELECT COUNT(*) FROM prayer_interactions
              WHERE request_id = pr.id AND type = 'comment') as comment_count,
             EXISTS(SELECT 1 FROM prayer_interactions
              WHERE request_id = pr.id AND user_id = $1 AND type = 'prayed') as has_prayed
      FROM prayer_requests pr
      JOIN users u ON pr.user_id = u.id
    `

    const conditions = []
    const values = [req.user.id]
    let paramCount = 1

    if (status) {
      paramCount++
      conditions.push(`pr.status = $${paramCount}`)
      values.push(status)
    } else {
      conditions.push("pr.status = 'active'")
    }

    if (category && category !== 'All') {
      paramCount++
      conditions.push(`pr.category = $${paramCount}`)
      values.push(category)
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY pr.created_at DESC'

    const result = await pool.query(query, values)

    const requests = result.rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      isAnonymous: r.is_anonymous,
      prayerCount: r.prayer_count,
      commentCount: parseInt(r.comment_count),
      status: r.status,
      createdAt: r.created_at,
      userId: r.user_id,
      userName: r.is_anonymous ? 'Anonymous' : r.user_name,
      userAvatar: r.is_anonymous ? '🙏' : r.user_avatar,
      userPhoto: r.is_anonymous ? null : r.user_photo,
      hasPrayed: r.has_prayed
    }))

    res.json({ requests })
  } catch (error) {
    next(error)
  }
})

// POST /api/prayers
router.post('/', async (req, res, next) => {
  try {
    const { title, description, category, isAnonymous } = req.body

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required.' })
    }

    const validCategories = ['Health', 'Family', 'Guidance', 'Gratitude', 'Financial', 'Other']
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category.' })
    }

    const result = await pool.query(
      `INSERT INTO prayer_requests (user_id, title, description, category, is_anonymous)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.user.id, title, description || null, category, isAnonymous || false]
    )

    const r = result.rows[0]
    res.status(201).json({
      request: {
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        isAnonymous: r.is_anonymous,
        prayerCount: r.prayer_count,
        commentCount: 0,
        status: r.status,
        createdAt: r.created_at,
        userId: r.user_id,
        hasPrayed: false
      }
    })
  } catch (error) {
    next(error)
  }
})

// POST /api/prayers/:id/pray
router.post('/:id/pray', async (req, res, next) => {
  try {
    const requestId = req.params.id

    // Check if already prayed
    const existing = await pool.query(
      "SELECT id FROM prayer_interactions WHERE user_id = $1 AND request_id = $2 AND type = 'prayed'",
      [req.user.id, requestId]
    )

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already prayed for this request.' })
    }

    // Add prayer interaction and increment count
    await pool.query(
      "INSERT INTO prayer_interactions (user_id, request_id, type) VALUES ($1, $2, 'prayed')",
      [req.user.id, requestId]
    )

    const result = await pool.query(
      'UPDATE prayer_requests SET prayer_count = prayer_count + 1 WHERE id = $1 RETURNING prayer_count',
      [requestId]
    )

    res.json({ prayerCount: result.rows[0].prayer_count })
  } catch (error) {
    next(error)
  }
})

// GET /api/prayers/:id/comments
router.get('/:id/comments', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT pi.id, pi.comment_text, pi.created_at, pi.user_id,
              u.name as user_name, u.avatar as user_avatar, u.photo_url as user_photo
       FROM prayer_interactions pi
       JOIN users u ON pi.user_id = u.id
       WHERE pi.request_id = $1 AND pi.type = 'comment'
       ORDER BY pi.created_at ASC`,
      [req.params.id]
    )

    const comments = result.rows.map(c => ({
      id: c.id,
      text: c.comment_text,
      createdAt: c.created_at,
      userId: c.user_id,
      userName: c.user_name,
      userAvatar: c.user_avatar,
      userPhoto: c.user_photo
    }))

    res.json({ comments })
  } catch (error) {
    next(error)
  }
})

// POST /api/prayers/:id/comments
router.post('/:id/comments', async (req, res, next) => {
  try {
    const { text } = req.body
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required.' })
    }

    const result = await pool.query(
      `INSERT INTO prayer_interactions (user_id, request_id, type, comment_text)
       VALUES ($1, $2, 'comment', $3)
       RETURNING id, comment_text, created_at`,
      [req.user.id, req.params.id, text.trim()]
    )

    const c = result.rows[0]
    res.status(201).json({
      comment: {
        id: c.id,
        text: c.comment_text,
        createdAt: c.created_at,
        userId: req.user.id
      }
    })
  } catch (error) {
    next(error)
  }
})

// PATCH /api/prayers/:id (mark answered)
router.patch('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      "UPDATE prayer_requests SET status = 'answered', updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prayer request not found or not yours.' })
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/prayers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM prayer_requests WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prayer request not found or not yours.' })
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
