// ============================================================
// Community Events Routes
// ============================================================
// GET    /api/events              - List events (optional ?category= and ?event_type= filters)
// GET    /api/events/my-upcoming  - Events the current user has RSVP'd to
// GET    /api/events/:id          - Single event with attendee list
// POST   /api/events              - Create a new event (in-person or digital)
// POST   /api/events/:id/rsvp     - RSVP to an event (toggle on)
// DELETE /api/events/:id/rsvp     - Un-RSVP from an event
// DELETE /api/events/:id          - Delete event (creator only)

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'
import { createNotification } from '../utils/createNotification.js'

const router = Router()

router.use(authenticate)

const IN_PERSON_CATEGORIES = ['Social', 'Service/Mission', 'Youth', 'Worship', 'Active/Outdoor']
const DIGITAL_CATEGORIES = ['Sermons/Teachings', 'Prayer', 'Worship', 'Bible Study', 'General']
const ALL_CATEGORIES = [...new Set([...IN_PERSON_CATEGORIES, ...DIGITAL_CATEGORIES])]

// Compute event status based on type, is_live, and timing
function computeEventStatus(event) {
  const now = new Date()
  const eventTime = new Date(event.dateTime)

  if (event.eventType === 'digital') {
    if (!event.isLive) {
      // Recorded content — always available
      return 'recorded'
    }
    // Live stream: "live_now" if within a 2-hour window after start
    const twoHoursAfter = new Date(eventTime.getTime() + 2 * 60 * 60 * 1000)
    if (now >= eventTime && now <= twoHoursAfter) return 'live_now'
    if (now < eventTime) return 'upcoming'
    return 'past'
  }

  // In-person events
  if (eventTime < now) return 'past'
  return 'upcoming'
}

// GET /api/events
router.get('/', async (req, res, next) => {
  try {
    const { category, event_type } = req.query

    let query = `
      SELECT e.id, e.title, e.description, e.date_time, e.location, e.category,
             e.event_type, e.event_link, e.is_live,
             e.church_id, e.created_by, e.created_at,
             c.name AS church_name,
             u.name AS creator_name, u.avatar AS creator_avatar, u.photo_url AS creator_photo,
             (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id) AS rsvp_count,
             EXISTS(SELECT 1 FROM event_rsvps WHERE event_id = e.id AND user_id = $1) AS has_rsvpd
      FROM events e
      LEFT JOIN churches c ON c.id = e.church_id
      JOIN users u ON u.id = e.created_by
      WHERE u.id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
        )
    `

    const values = [req.user.id]
    let paramCount = 1

    // Event type filter + time filtering
    if (event_type === 'digital') {
      query += ` AND e.event_type = 'digital'`
      // Show: recorded (always), live upcoming, live now (within 2hr window)
      query += ` AND (
        e.is_live = false
        OR e.date_time > NOW() - INTERVAL '2 hours'
      )`
    } else {
      // Default to in-person — future events only
      query += ` AND e.event_type = 'in_person'`
      query += ` AND e.date_time > NOW()`
    }

    if (category && ALL_CATEGORIES.includes(category)) {
      paramCount++
      query += ` AND e.category = $${paramCount}`
      values.push(category)
    }

    query += ' ORDER BY e.date_time ASC'

    const result = await pool.query(query, values)

    const events = result.rows.map(r => {
      const event = {
        id: r.id,
        title: r.title,
        description: r.description,
        dateTime: r.date_time,
        location: r.location,
        category: r.category,
        eventType: r.event_type,
        eventLink: r.event_link,
        isLive: r.is_live,
        churchId: r.church_id,
        churchName: r.church_name,
        creatorId: r.created_by,
        creatorName: r.creator_name,
        creatorAvatar: r.creator_avatar,
        creatorPhoto: r.creator_photo,
        rsvpCount: parseInt(r.rsvp_count),
        hasRsvpd: r.has_rsvpd,
        createdAt: r.created_at
      }
      event.status = computeEventStatus(event)
      return event
    })

    res.json({ events })
  } catch (error) {
    next(error)
  }
})

// GET /api/events/my-upcoming (MUST be before /:id)
router.get('/my-upcoming', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT e.id, e.title, e.date_time, e.location, e.category,
             e.event_type, e.event_link, e.is_live,
             c.name AS church_name
      FROM events e
      JOIN event_rsvps r ON r.event_id = e.id
      LEFT JOIN churches c ON c.id = e.church_id
      WHERE r.user_id = $1
        AND (
          (e.event_type = 'in_person' AND e.date_time > NOW())
          OR (e.event_type = 'digital' AND e.is_live = true AND e.date_time > NOW())
          OR (e.event_type = 'digital' AND e.is_live = false)
        )
      ORDER BY e.date_time ASC
      LIMIT 10
    `, [req.user.id])

    const events = result.rows.map(r => {
      const event = {
        id: r.id,
        title: r.title,
        dateTime: r.date_time,
        location: r.location,
        category: r.category,
        eventType: r.event_type,
        eventLink: r.event_link,
        isLive: r.is_live,
        churchName: r.church_name
      }
      event.status = computeEventStatus(event)
      return event
    })

    res.json({ events })
  } catch (error) {
    next(error)
  }
})

// GET /api/events/:id
router.get('/:id', async (req, res, next) => {
  try {
    const eventResult = await pool.query(`
      SELECT e.id, e.title, e.description, e.date_time, e.location, e.category,
             e.event_type, e.event_link, e.is_live,
             e.church_id, e.created_by, e.created_at,
             c.name AS church_name,
             u.name AS creator_name, u.avatar AS creator_avatar, u.photo_url AS creator_photo,
             (SELECT COUNT(*) FROM event_rsvps WHERE event_id = e.id) AS rsvp_count,
             EXISTS(SELECT 1 FROM event_rsvps WHERE event_id = e.id AND user_id = $2) AS has_rsvpd
      FROM events e
      LEFT JOIN churches c ON c.id = e.church_id
      JOIN users u ON u.id = e.created_by
      WHERE e.id = $1
    `, [req.params.id, req.user.id])

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' })
    }

    const r = eventResult.rows[0]
    const event = {
      id: r.id,
      title: r.title,
      description: r.description,
      dateTime: r.date_time,
      location: r.location,
      category: r.category,
      eventType: r.event_type,
      eventLink: r.event_link,
      isLive: r.is_live,
      churchId: r.church_id,
      churchName: r.church_name,
      creatorId: r.created_by,
      creatorName: r.creator_name,
      creatorAvatar: r.creator_avatar,
      creatorPhoto: r.creator_photo,
      rsvpCount: parseInt(r.rsvp_count),
      hasRsvpd: r.has_rsvpd,
      createdAt: r.created_at
    }
    event.status = computeEventStatus(event)

    // Get attendees
    const attendeesResult = await pool.query(`
      SELECT u.id, u.name, u.avatar, u.photo_url, u.role
      FROM event_rsvps r
      JOIN users u ON u.id = r.user_id
      WHERE r.event_id = $1
        AND u.id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $2
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $2
        )
      ORDER BY r.created_at ASC
    `, [req.params.id, req.user.id])

    const attendees = attendeesResult.rows.map(a => ({
      id: a.id,
      name: a.name,
      avatar: a.avatar,
      photoUrl: a.photo_url,
      role: a.role
    }))

    res.json({ event, attendees })
  } catch (error) {
    next(error)
  }
})

// POST /api/events
router.post('/', async (req, res, next) => {
  try {
    const { title, description, dateTime, location, category, churchId, eventType, eventLink, isLive } = req.body
    const type = eventType || 'in_person'

    if (!title || !category) {
      return res.status(400).json({ error: 'Title and category are required.' })
    }

    // Validate category matches event type
    if (type === 'digital') {
      if (!DIGITAL_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Invalid category for digital event.' })
      }
    } else {
      if (!IN_PERSON_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: 'Invalid category.' })
      }
      if (!dateTime) {
        return res.status(400).json({ error: 'Date/time is required for in-person events.' })
      }
    }

    // For digital live events, dateTime is required. For recorded, use current time if not provided.
    const finalDateTime = dateTime || new Date().toISOString()

    // Basic URL validation for digital events
    if (type === 'digital' && eventLink) {
      try {
        new URL(eventLink)
      } catch {
        return res.status(400).json({ error: 'Invalid event link URL.' })
      }
    }

    const result = await pool.query(
      `INSERT INTO events (title, description, date_time, location, category, event_type, event_link, is_live, created_by, church_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [title, description || null, finalDateTime, location || null, category, type, eventLink || null, type === 'digital' ? (isLive || false) : false, req.user.id, churchId || null]
    )

    const eventId = result.rows[0].id

    // Auto-RSVP the creator
    await pool.query(
      'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2)',
      [eventId, req.user.id]
    )

    res.status(201).json({ eventId })
  } catch (error) {
    next(error)
  }
})

// POST /api/events/:id/rsvp
router.post('/:id/rsvp', async (req, res, next) => {
  try {
    await pool.query(
      'INSERT INTO event_rsvps (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, req.user.id]
    )

    const result = await pool.query(
      'SELECT COUNT(*) AS count FROM event_rsvps WHERE event_id = $1',
      [req.params.id]
    )

    // Notify event creator about the RSVP
    const eventInfo = await pool.query(
      'SELECT created_by, title FROM events WHERE id = $1',
      [req.params.id]
    )
    const rsvpUserInfo = await pool.query('SELECT name FROM users WHERE id = $1', [req.user.id])
    const io = req.app.get('io')
    await createNotification(io, {
      userId: eventInfo.rows[0].created_by,
      actorId: req.user.id,
      type: 'event_rsvp',
      title: `${rsvpUserInfo.rows[0].name} is going to your event`,
      body: eventInfo.rows[0].title,
      referenceType: 'event',
      referenceId: parseInt(req.params.id)
    })

    res.json({ rsvpCount: parseInt(result.rows[0].count) })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/events/:id/rsvp
router.delete('/:id/rsvp', async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM event_rsvps WHERE event_id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )

    const result = await pool.query(
      'SELECT COUNT(*) AS count FROM event_rsvps WHERE event_id = $1',
      [req.params.id]
    )

    res.json({ rsvpCount: parseInt(result.rows[0].count) })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/events/:id (creator only)
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 AND created_by = $2 RETURNING id',
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or not yours.' })
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
