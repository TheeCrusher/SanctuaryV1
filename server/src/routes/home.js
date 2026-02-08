// ============================================================
// Home Screen Routes
// ============================================================
// GET /api/home - Aggregated dashboard data in a single call
//
// Returns notifications, upcoming appointments, community
// activity, and session stats. Runs all queries in parallel
// for fast loading.

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.use(authenticate)

// GET /api/home
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id

    // Run all queries in parallel for speed
    const [
      unreadResult,
      pendingConnResult,
      prayerActivityResult,
      pendingSessionsResult,
      upcomingResult,
      communityActivityResult,
      statsResult
    ] = await Promise.all([

      // 1. Unread messages count
      pool.query(
        `SELECT COALESCE(SUM(unread_count), 0) AS count
         FROM conversations
         WHERE owner_id = $1 AND unread_count > 0`,
        [userId]
      ),

      // 2. Pending connection requests (incoming only — needs action)
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM user_connections
         WHERE recipient_id = $1 AND status = 'pending'`,
        [userId]
      ),

      // 3. Prayer activity on YOUR posts in last 7 days (by others)
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM prayer_interactions pi
         JOIN prayer_requests pr ON pi.request_id = pr.id
         WHERE pr.user_id = $1
           AND pi.user_id != $1
           AND pi.created_at > NOW() - INTERVAL '7 days'`,
        [userId]
      ),

      // 4. Pending session requests (appointments where status=pending)
      pool.query(
        `SELECT COUNT(*)::int AS count
         FROM appointments
         WHERE guide_id = $1 AND status = 'pending' AND date >= CURRENT_DATE`,
        [userId]
      ),

      // 5. Upcoming appointments (next 5, not completed/cancelled)
      pool.query(
        `SELECT a.id, a.seeker_name, a.avatar, a.date, a.time, a.type,
                a.status, a.guide_id, a.seeker_id,
                COALESCE(ug.name, '') AS guide_name,
                COALESCE(us.name, a.seeker_name) AS display_name
         FROM appointments a
         LEFT JOIN users ug ON a.guide_id = ug.id
         LEFT JOIN users us ON a.seeker_id = us.id
         WHERE (a.guide_id = $1 OR a.seeker_id = $1)
           AND a.status NOT IN ('completed', 'cancelled')
           AND a.date >= CURRENT_DATE
         ORDER BY a.date ASC, a.time ASC
         LIMIT 5`,
        [userId]
      ),

      // 6. Community activity — recent prayer posts from connections (limit 5)
      pool.query(
        `SELECT pr.id, pr.title, pr.category, pr.prayer_count, pr.is_anonymous,
                pr.created_at, pr.user_id,
                u.name AS user_name, u.avatar AS user_avatar, u.photo_url AS user_photo
         FROM prayer_requests pr
         JOIN users u ON pr.user_id = u.id
         WHERE pr.status = 'active'
           AND pr.user_id IN (
             SELECT CASE
               WHEN uc.requester_id = $1 THEN uc.recipient_id
               ELSE uc.requester_id
             END
             FROM user_connections uc
             WHERE (uc.requester_id = $1 OR uc.recipient_id = $1)
               AND uc.status = 'accepted'
           )
         ORDER BY pr.created_at DESC
         LIMIT 5`,
        [userId]
      ),

      // 7. Session stats
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status NOT IN ('completed', 'cancelled'))::int AS upcoming,
           COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
           COUNT(DISTINCT seeker_name) AS unique_seekers
         FROM appointments
         WHERE (guide_id = $1 OR seeker_id = $1)`,
        [userId]
      )
    ])

    // Format the response
    res.json({
      notifications: {
        unreadMessages: parseInt(unreadResult.rows[0].count),
        pendingConnections: pendingConnResult.rows[0].count,
        prayerActivity: prayerActivityResult.rows[0].count,
        pendingSessions: pendingSessionsResult.rows[0].count
      },
      upcomingAppointments: upcomingResult.rows.map(a => ({
        id: a.id,
        seekerName: a.seeker_name,
        avatar: a.avatar,
        date: a.date,
        time: a.time,
        type: a.type,
        status: a.status,
        guideId: a.guide_id,
        seekerId: a.seeker_id,
        guideName: a.guide_name,
        displayName: a.display_name
      })),
      communityActivity: communityActivityResult.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        prayerCount: r.prayer_count,
        isAnonymous: r.is_anonymous,
        createdAt: r.created_at,
        userId: r.user_id,
        userName: r.is_anonymous ? 'Anonymous' : r.user_name,
        userAvatar: r.is_anonymous ? '🙏' : r.user_avatar,
        userPhoto: r.is_anonymous ? null : r.user_photo
      })),
      sessionStats: {
        upcoming: statsResult.rows[0].upcoming,
        completed: statsResult.rows[0].completed,
        uniqueSeekers: parseInt(statsResult.rows[0].unique_seekers)
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
