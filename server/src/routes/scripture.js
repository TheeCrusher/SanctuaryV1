// ============================================================
// Scripture Study Routes
// ============================================================
// GET    /api/scripture/daily              - Verse of the day
// GET    /api/scripture/verses             - All verses (?category= filter)
// GET    /api/scripture/verses/random      - Random verse
// GET    /api/scripture/bookmarks          - User's bookmarked verse IDs
// POST   /api/scripture/bookmarks/:verseId - Bookmark a verse
// DELETE /api/scripture/bookmarks/:verseId - Unbookmark a verse
// GET    /api/scripture/plans              - All reading plans (with progress)
// POST   /api/scripture/plans/custom       - Create a custom reading plan
// POST   /api/scripture/plans/surprise     - Generate a random reading plan
// DELETE /api/scripture/plans/:id          - Delete a custom plan
// GET    /api/scripture/plans/:id          - Plan detail with days
// GET    /api/scripture/plans/:id/progress - User's progress on a plan
// POST   /api/scripture/plans/:id/progress - Mark a day as complete
// GET    /api/scripture/memorization/stats  - Get memorization stats + streak
// POST   /api/scripture/memorization/record - Record a game round result
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
// Returns all reading plans (presets + user's custom plans) with
// inline progress data so the frontend can show progress bars.

router.get('/plans', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT rp.*, urp.completed_days, urp.started_at AS progress_started
       FROM reading_plans rp
       LEFT JOIN user_reading_progress urp ON rp.id = urp.plan_id AND urp.user_id = $1
       WHERE rp.created_by IS NULL OR rp.created_by = $1
       ORDER BY
         CASE WHEN urp.started_at IS NOT NULL THEN 0 ELSE 1 END,
         urp.started_at DESC,
         rp.id`,
      [req.user.id]
    )
    const plans = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      totalDays: row.total_days,
      isCustom: row.created_by !== null,
      completedDays: row.completed_days || [],
      startedAt: row.progress_started || null
    }))
    res.json({ plans })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/scripture/plans/custom
// ============================================================
// Creates a custom reading plan from a chosen category.
// Selects random verses and assigns one per day.

router.post('/plans/custom', async (req, res, next) => {
  try {
    const { name, category, duration } = req.body

    if (!name || !category || !duration) {
      return res.status(400).json({ error: 'name, category, and duration are required.' })
    }

    if (![7, 14, 21, 30].includes(duration)) {
      return res.status(400).json({ error: 'duration must be 7, 14, 21, or 30.' })
    }

    // Get verses from the chosen category
    const versesResult = await pool.query(
      'SELECT * FROM scripture_verses WHERE category = $1 ORDER BY RANDOM()',
      [category]
    )

    if (versesResult.rows.length === 0) {
      return res.status(400).json({ error: 'No verses found for this category.' })
    }

    // Cycle verses if fewer than duration
    const verses = versesResult.rows
    const planVerses = []
    for (let i = 0; i < duration; i++) {
      planVerses.push(verses[i % verses.length])
    }

    // Create the plan
    const planResult = await pool.query(
      `INSERT INTO reading_plans (name, description, total_days, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, `Custom ${category} study plan - ${duration} days`, duration, req.user.id]
    )
    const plan = planResult.rows[0]

    // Insert days
    for (let i = 0; i < planVerses.length; i++) {
      await pool.query(
        'INSERT INTO reading_plan_days (plan_id, day_number, title, reference) VALUES ($1, $2, $3, $4)',
        [plan.id, i + 1, planVerses[i].reference, planVerses[i].text.substring(0, 80) + '...']
      )
    }

    res.status(201).json({
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        totalDays: plan.total_days,
        isCustom: true,
        completedDays: [],
        startedAt: null
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/scripture/plans/surprise
// ============================================================
// Generates a random reading plan mixing all categories.

router.post('/plans/surprise', async (req, res, next) => {
  try {
    const duration = req.body.duration || 7

    if (![7, 14, 21, 30].includes(duration)) {
      return res.status(400).json({ error: 'duration must be 7, 14, 21, or 30.' })
    }

    // Get random verses from all categories
    const versesResult = await pool.query(
      'SELECT * FROM scripture_verses ORDER BY RANDOM() LIMIT $1',
      [duration]
    )

    const verses = versesResult.rows
    // If we have fewer verses than duration, cycle them
    const planVerses = []
    for (let i = 0; i < duration; i++) {
      planVerses.push(verses[i % verses.length])
    }

    // Create the plan
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const planResult = await pool.query(
      `INSERT INTO reading_plans (name, description, total_days, created_by)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [`Surprise Plan - ${today}`, `A ${duration}-day journey through mixed scripture topics.`, duration, req.user.id]
    )
    const plan = planResult.rows[0]

    // Insert days
    for (let i = 0; i < planVerses.length; i++) {
      await pool.query(
        'INSERT INTO reading_plan_days (plan_id, day_number, title, reference) VALUES ($1, $2, $3, $4)',
        [plan.id, i + 1, planVerses[i].reference, planVerses[i].text.substring(0, 80) + '...']
      )
    }

    res.status(201).json({
      plan: {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        totalDays: plan.total_days,
        isCustom: true,
        completedDays: [],
        startedAt: null
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/scripture/plans/:id
// ============================================================
// Deletes a custom reading plan (user can only delete their own).

router.delete('/plans/:id', async (req, res, next) => {
  try {
    // Verify it's the user's custom plan
    const check = await pool.query(
      'SELECT * FROM reading_plans WHERE id = $1',
      [req.params.id]
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found.' })
    }

    if (check.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Cannot delete preset plans.' })
    }

    // CASCADE will delete plan_days and progress
    await pool.query('DELETE FROM reading_plans WHERE id = $1', [req.params.id])
    res.json({ success: true })
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

// ============================================================
// GET /api/scripture/memorization/stats
// ============================================================
// Returns the user's memorization streak and per-verse stats.

router.get('/memorization/stats', async (req, res, next) => {
  try {
    // Get or create streak record
    let streakResult = await pool.query(
      'SELECT * FROM user_study_streaks WHERE user_id = $1',
      [req.user.id]
    )

    let streak = { current: 0, longest: 0, lastDate: null }

    if (streakResult.rows.length > 0) {
      const row = streakResult.rows[0]
      const today = new Date().toISOString().split('T')[0]
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      const lastDate = row.last_study_date ? row.last_study_date.toISOString().split('T')[0] : null

      // If last study date is older than yesterday, streak is broken
      if (lastDate && lastDate !== today && lastDate !== yesterday) {
        await pool.query(
          'UPDATE user_study_streaks SET current_streak = 0 WHERE user_id = $1',
          [req.user.id]
        )
        streak = { current: 0, longest: row.longest_streak, lastDate }
      } else {
        streak = { current: row.current_streak, longest: row.longest_streak, lastDate }
      }
    }

    // Get per-verse stats
    const statsResult = await pool.query(
      `SELECT verse_id, mode, attempts, correct_count, last_practiced
       FROM user_memorization_stats WHERE user_id = $1
       ORDER BY last_practiced DESC`,
      [req.user.id]
    )

    res.json({
      streak,
      verseStats: statsResult.rows.map(r => ({
        verseId: r.verse_id,
        mode: r.mode,
        attempts: r.attempts,
        correctCount: r.correct_count,
        lastPracticed: r.last_practiced
      }))
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/scripture/memorization/record
// ============================================================
// Records the result of a single game round (one verse).
// Updates per-verse stats and the daily study streak.

router.post('/memorization/record', async (req, res, next) => {
  try {
    const { verseId, mode, correct } = req.body

    if (!verseId || !mode) {
      return res.status(400).json({ error: 'verseId and mode are required.' })
    }

    // Upsert verse stats
    const correctIncrement = correct ? 1 : 0
    await pool.query(
      `INSERT INTO user_memorization_stats (user_id, verse_id, mode, attempts, correct_count, last_practiced)
       VALUES ($1, $2, $3, 1, $4, NOW())
       ON CONFLICT (user_id, verse_id, mode)
       DO UPDATE SET
         attempts = user_memorization_stats.attempts + 1,
         correct_count = user_memorization_stats.correct_count + $4,
         last_practiced = NOW()`,
      [req.user.id, verseId, mode, correctIncrement]
    )

    // Update streak
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

    const streakResult = await pool.query(
      'SELECT * FROM user_study_streaks WHERE user_id = $1',
      [req.user.id]
    )

    let currentStreak, longestStreak

    if (streakResult.rows.length === 0) {
      // First ever game — create streak record
      currentStreak = 1
      longestStreak = 1
      await pool.query(
        `INSERT INTO user_study_streaks (user_id, current_streak, longest_streak, last_study_date)
         VALUES ($1, 1, 1, $2)`,
        [req.user.id, today]
      )
    } else {
      const row = streakResult.rows[0]
      const lastDate = row.last_study_date ? row.last_study_date.toISOString().split('T')[0] : null

      if (lastDate === today) {
        // Already played today — no streak change
        currentStreak = row.current_streak
        longestStreak = row.longest_streak
      } else if (lastDate === yesterday) {
        // Consecutive day — increment streak
        currentStreak = row.current_streak + 1
        longestStreak = Math.max(row.longest_streak, currentStreak)
        await pool.query(
          `UPDATE user_study_streaks SET current_streak = $1, longest_streak = $2, last_study_date = $3
           WHERE user_id = $4`,
          [currentStreak, longestStreak, today, req.user.id]
        )
      } else {
        // Gap — reset streak to 1
        currentStreak = 1
        longestStreak = Math.max(row.longest_streak, 1)
        await pool.query(
          `UPDATE user_study_streaks SET current_streak = 1, longest_streak = $1, last_study_date = $2
           WHERE user_id = $3`,
          [longestStreak, today, req.user.id]
        )
      }
    }

    res.json({
      streak: { current: currentStreak, longest: longestStreak }
    })
  } catch (error) {
    next(error)
  }
})

export default router
