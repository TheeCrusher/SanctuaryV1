// ============================================================
// Scripture Study Routes
// ============================================================
// GET    /api/scripture/daily              - Verse of the day
// GET    /api/scripture/verses             - All verses (?category= filter)
// GET    /api/scripture/verses/random      - Random verse
// GET    /api/scripture/bookmarks          - User's bookmarked verse IDs
// POST   /api/scripture/bookmarks/:verseId - Bookmark a verse
// DELETE /api/scripture/bookmarks/:verseId - Unbookmark a verse
// GET    /api/scripture/plans              - All reading plans
// GET    /api/scripture/plans/:id          - Plan detail with days
// GET    /api/scripture/plans/:id/progress - User's progress on a plan
// POST   /api/scripture/plans/:id/progress - Mark a day as complete
//
// All routes are protected (require JWT token).
// Maps to: AppContext.jsx → scripture state + functions
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All scripture routes require authentication
router.use(authenticate)

// ============================================================
// GET /api/scripture/daily
// ============================================================
// Returns the verse of the day based on the current day of the year.

router.get('/daily', async (req, res, next) => {
  try {
    // Get total verse count
    const countResult = await pool.query('SELECT COUNT(*) FROM scripture_verses')
    const totalVerses = parseInt(countResult.rows[0].count)

    if (totalVerses === 0) {
      return res.json({ verse: null })
    }

    // Calculate which verse to show based on day of year
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const diff = now - start
    const oneDay = 1000 * 60 * 60 * 24
    const dayOfYear = Math.floor(diff / oneDay)
    const offset = dayOfYear % totalVerses

    const result = await pool.query(
      'SELECT * FROM scripture_verses ORDER BY id LIMIT 1 OFFSET $1',
      [offset]
    )

    const row = result.rows[0]
    res.json({
      verse: {
        id: row.id,
        text: row.text,
        reference: row.reference,
        category: row.category
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/scripture/verses
// ============================================================
// Returns all verses, optionally filtered by category.

router.get('/verses', async (req, res, next) => {
  try {
    const { category } = req.query
    let result

    if (category) {
      result = await pool.query(
        'SELECT * FROM scripture_verses WHERE category = $1 ORDER BY id',
        [category]
      )
    } else {
      result = await pool.query('SELECT * FROM scripture_verses ORDER BY id')
    }

    const verses = result.rows.map(row => ({
      id: row.id,
      text: row.text,
      reference: row.reference,
      category: row.category
    }))

    res.json({ verses })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/scripture/verses/random
// ============================================================
// Returns a random verse.

router.get('/verses/random', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM scripture_verses ORDER BY RANDOM() LIMIT 1'
    )

    if (result.rows.length === 0) {
      return res.json({ verse: null })
    }

    const row = result.rows[0]
    res.json({
      verse: {
        id: row.id,
        text: row.text,
        reference: row.reference,
        category: row.category
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/scripture/bookmarks
// ============================================================
// Returns array of verse IDs the user has bookmarked.

router.get('/bookmarks', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT verse_id FROM user_verse_bookmarks WHERE user_id = $1',
      [req.user.id]
    )
    const bookmarkIds = result.rows.map(r => r.verse_id)
    res.json({ bookmarkIds })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/scripture/bookmarks/:verseId
// ============================================================

router.post('/bookmarks/:verseId', async (req, res, next) => {
  try {
    await pool.query(
      `INSERT INTO user_verse_bookmarks (user_id, verse_id) VALUES ($1, $2)
       ON CONFLICT (user_id, verse_id) DO NOTHING`,
      [req.user.id, req.params.verseId]
    )
    res.status(201).json({ success: true })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/scripture/bookmarks/:verseId
// ============================================================

router.delete('/bookmarks/:verseId', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM user_verse_bookmarks WHERE user_id = $1 AND verse_id = $2',
      [req.user.id, req.params.verseId]
    )
    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/scripture/plans
// ============================================================
// Returns all reading plans (without days — use /:id for full detail).

router.get('/plans', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM reading_plans ORDER BY id')
    const plans = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      totalDays: row.total_days
    }))
    res.json({ plans })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/scripture/plans/:id
// ============================================================
// Returns a specific plan with all its days.

router.get('/plans/:id', async (req, res, next) => {
  try {
    const planResult = await pool.query(
      'SELECT * FROM reading_plans WHERE id = $1',
      [req.params.id]
    )

    if (planResult.rows.length === 0) {
      return res.status(404).json({ error: 'Reading plan not found.' })
    }

    const plan = planResult.rows[0]

    const daysResult = await pool.query(
      'SELECT * FROM reading_plan_days WHERE plan_id = $1 ORDER BY day_number',
      [req.params.id]
    )

    const days = daysResult.rows.map(row => ({
      id: row.id,
      dayNumber: row.day_number,
      title: row.title,
      reference: row.reference
    }))

    res.json({
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        totalDays: plan.total_days,
        days
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/scripture/plans/:id/progress
// ============================================================
// Returns which days the user has completed in a plan.

router.get('/plans/:id/progress', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM user_reading_progress WHERE user_id = $1 AND plan_id = $2',
      [req.user.id, req.params.id]
    )

    if (result.rows.length === 0) {
      return res.json({ progress: { completedDays: [], startedAt: null } })
    }

    const row = result.rows[0]
    res.json({
      progress: {
        completedDays: row.completed_days || [],
        startedAt: row.started_at
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/scripture/plans/:id/progress
// ============================================================
// Marks a day as complete. Uses UPSERT to create or update.

router.post('/plans/:id/progress', async (req, res, next) => {
  try {
    const { dayNumber } = req.body

    if (!dayNumber) {
      return res.status(400).json({ error: 'dayNumber is required.' })
    }

    // Upsert: insert if not exists, or add to completed_days array
    const result = await pool.query(
      `INSERT INTO user_reading_progress (user_id, plan_id, completed_days)
       VALUES ($1, $2, ARRAY[$3]::integer[])
       ON CONFLICT (user_id, plan_id)
       DO UPDATE SET completed_days = (
         SELECT ARRAY(SELECT DISTINCT unnest(
           user_reading_progress.completed_days || ARRAY[$3]::integer[]
         ) ORDER BY 1)
       )
       RETURNING *`,
      [req.user.id, req.params.id, dayNumber]
    )

    const row = result.rows[0]
    res.json({
      progress: {
        completedDays: row.completed_days || [],
        startedAt: row.started_at
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
