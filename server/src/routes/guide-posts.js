// ============================================================
// Guide Posts Routes
// ============================================================
// GET    /api/guide-posts             - Full feed (all guides, newest first)
// GET    /api/guide-posts/connections - Posts from connected guides only (dashboard)
// GET    /api/guide-posts/user/:id    - Posts by a specific guide (profile view)
// POST   /api/guide-posts             - Create a post (guide only)
// POST   /api/guide-posts/:id/like   - Toggle like on a post
// DELETE /api/guide-posts/:id         - Delete own post (guide only)

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// Shared SELECT fragment — used in multiple queries
const POST_SELECT = `
  gp.id, gp.user_id, gp.title, gp.content, gp.post_type,
  gp.scripture_ref, gp.like_count, gp.created_at,
  u.name AS user_name, u.avatar AS user_avatar,
  u.photo_url AS user_photo, u.denomination AS user_denomination
`

function formatPost(row, currentUserId, likedSet) {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    postType: row.post_type,
    scriptureRef: row.scripture_ref,
    likeCount: row.like_count,
    createdAt: row.created_at,
    userName: row.user_name,
    userAvatar: row.user_avatar,
    userPhoto: row.user_photo,
    userDenomination: row.user_denomination,
    liked: likedSet ? likedSet.has(row.id) : row.liked === true,
    isOwn: row.user_id === currentUserId
  }
}

// ── GET /api/guide-posts ───────────────────────────────────────────────────
// Full feed — all guides, newest first. Optional ?type= filter.
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id
    const { type } = req.query

    let query = `
      SELECT ${POST_SELECT},
        EXISTS(
          SELECT 1 FROM guide_post_likes WHERE post_id = gp.id AND user_id = $1
        ) AS liked
      FROM guide_posts gp
      JOIN users u ON u.id = gp.user_id
      WHERE u.role = 'guide'
        AND u.id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
        )
    `
    const values = [userId]

    if (type && ['devotional','reflection','scripture','general'].includes(type)) {
      values.push(type)
      query += ` AND gp.post_type = $${values.length}`
    }

    query += ' ORDER BY gp.created_at DESC LIMIT 30'

    const result = await pool.query(query, values)
    res.json({ posts: result.rows.map(r => formatPost(r, userId, null)) })
  } catch (error) {
    next(error)
  }
})

// ── GET /api/guide-posts/connections ──────────────────────────────────────
// Posts from guides you're connected with — used by the seeker dashboard.
router.get('/connections', async (req, res, next) => {
  try {
    const userId = req.user.id

    const result = await pool.query(
      `SELECT ${POST_SELECT},
         EXISTS(
           SELECT 1 FROM guide_post_likes WHERE post_id = gp.id AND user_id = $1
         ) AS liked
       FROM guide_posts gp
       JOIN users u ON u.id = gp.user_id
       JOIN user_connections uc ON (
         (uc.requester_id = $1 AND uc.recipient_id = gp.user_id) OR
         (uc.recipient_id = $1 AND uc.requester_id = gp.user_id)
       ) AND uc.status = 'accepted'
       WHERE u.id NOT IN (
         SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
         UNION
         SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
       )
       ORDER BY gp.created_at DESC
       LIMIT 5`,
      [userId]
    )

    res.json({ posts: result.rows.map(r => formatPost(r, userId, null)) })
  } catch (error) {
    next(error)
  }
})

// ── GET /api/guide-posts/user/:id ─────────────────────────────────────────
// Posts by a specific guide — shown on their public profile.
router.get('/user/:id', async (req, res, next) => {
  try {
    const userId = req.user.id
    const guideId = parseInt(req.params.id)

    // Fetch posts + user's likes in parallel
    const [postsResult, likesResult] = await Promise.all([
      pool.query(
        `SELECT ${POST_SELECT}
         FROM guide_posts gp
         JOIN users u ON u.id = gp.user_id
         WHERE gp.user_id = $1
         ORDER BY gp.created_at DESC
         LIMIT 20`,
        [guideId]
      ),
      pool.query(
        'SELECT post_id FROM guide_post_likes WHERE user_id = $1',
        [userId]
      )
    ])

    const likedSet = new Set(likesResult.rows.map(r => r.post_id))
    res.json({ posts: postsResult.rows.map(r => formatPost(r, userId, likedSet)) })
  } catch (error) {
    next(error)
  }
})

// ── POST /api/guide-posts ─────────────────────────────────────────────────
// Create a new guide post. Guide role required.
router.post('/', async (req, res, next) => {
  try {
    // authenticate middleware only sets req.user.id — fetch role from DB
    const { rows: [currentUser] } = await pool.query(
      'SELECT role, name, avatar, photo_url, denomination FROM users WHERE id = $1',
      [req.user.id]
    )
    if (!currentUser || currentUser.role !== 'guide') {
      return res.status(403).json({ error: 'Only guides can publish posts.' })
    }

    const { title, content, postType, scriptureRef } = req.body

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'Title and content are required.' })
    }

    const type = ['devotional','reflection','scripture','general'].includes(postType)
      ? postType
      : 'general'

    const result = await pool.query(
      `INSERT INTO guide_posts (user_id, title, content, post_type, scripture_ref)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, title, content, post_type, scripture_ref, like_count, created_at`,
      [req.user.id, title.trim(), content.trim(), type, scriptureRef?.trim() || null]
    )

    const post = result.rows[0]
    res.status(201).json({
      post: {
        id: post.id,
        userId: post.user_id,
        title: post.title,
        content: post.content,
        postType: post.post_type,
        scriptureRef: post.scripture_ref,
        likeCount: post.like_count,
        createdAt: post.created_at,
        userName: currentUser.name,
        userAvatar: currentUser.avatar,
        userPhoto: currentUser.photo_url,
        userDenomination: currentUser.denomination,
        liked: false,
        isOwn: true
      }
    })
  } catch (error) {
    next(error)
  }
})

// ── POST /api/guide-posts/:id/like ────────────────────────────────────────
// Toggle like. Returns { liked, likeCount }.
router.post('/:id/like', async (req, res, next) => {
  try {
    const userId = req.user.id
    const postId = parseInt(req.params.id)

    // Try to insert a like row. ON CONFLICT means the user already liked it.
    const insertResult = await pool.query(
      `INSERT INTO guide_post_likes (user_id, post_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, post_id) DO NOTHING
       RETURNING id`,
      [userId, postId]
    )

    let liked
    if (insertResult.rows.length > 0) {
      // Row inserted — increment count
      liked = true
      await pool.query(
        'UPDATE guide_posts SET like_count = like_count + 1 WHERE id = $1',
        [postId]
      )
    } else {
      // Row already existed — remove it (unlike)
      liked = false
      await pool.query(
        'DELETE FROM guide_post_likes WHERE user_id = $1 AND post_id = $2',
        [userId, postId]
      )
      await pool.query(
        'UPDATE guide_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = $1',
        [postId]
      )
    }

    const { rows: [{ like_count }] } = await pool.query(
      'SELECT like_count FROM guide_posts WHERE id = $1', [postId]
    )

    res.json({ liked, likeCount: like_count })
  } catch (error) {
    next(error)
  }
})

// ── DELETE /api/guide-posts/:id ───────────────────────────────────────────
// Delete own post (guide only). Returns 204.
router.delete('/:id', async (req, res, next) => {
  try {
    const postId = parseInt(req.params.id)

    const result = await pool.query(
      'DELETE FROM guide_posts WHERE id = $1 AND user_id = $2 RETURNING id',
      [postId, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or not yours.' })
    }

    res.sendStatus(204)
  } catch (error) {
    next(error)
  }
})

export default router
