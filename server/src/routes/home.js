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

    // Fast role lookup first (indexed PK) — needed to branch stat queries
    const { rows: [{ role: userRole }] } = await pool.query(
      'SELECT role FROM users WHERE id = $1', [userId]
    )

    // Build shared queries (same for both roles)
    const sharedQueries = [

      // 1. Unread messages count (only where someone ELSE sent the last message)
      pool.query(
        `SELECT COALESCE(SUM(unread_count), 0) AS count
         FROM conversations
         WHERE (owner_id = $1 OR person_id = $1)
           AND unread_count > 0
           AND last_sender_id IS NOT NULL
           AND last_sender_id != $1`,
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
                COALESCE(us.name, a.seeker_name) AS display_name,
                COALESCE(us.photo_url, '') AS seeker_photo,
                COALESCE(ug.photo_url, '') AS guide_photo
         FROM appointments a
         LEFT JOIN users ug ON a.guide_id = ug.id
         LEFT JOIN users us ON a.seeker_id = us.id
         WHERE (a.guide_id = $1 OR a.seeker_id = $1)
           AND a.status NOT IN ('completed', 'cancelled', 'declined')
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
           AND u.id NOT IN (
             SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
             UNION
             SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
           )
         ORDER BY pr.created_at DESC
         LIMIT 5`,
        [userId]
      ),

      // 7. Upcoming RSVP'd events (next 5)
      pool.query(
        `SELECT e.id, e.title, e.date_time, e.location, e.category,
                c.name AS church_name
         FROM events e
         JOIN event_rsvps r ON r.event_id = e.id
         LEFT JOIN churches c ON c.id = e.church_id
         WHERE r.user_id = $1 AND e.date_time > NOW()
         ORDER BY e.date_time ASC
         LIMIT 5`,
        [userId]
      )
    ]

    // Add role-specific stat queries
    if (userRole === 'guide') {
      // Guide stats: upcoming sessions, completed, unique seekers helped
      sharedQueries.push(
        pool.query(
          `SELECT
             COUNT(*) FILTER (WHERE status NOT IN ('completed', 'cancelled', 'declined') AND date >= CURRENT_DATE)::int AS upcoming,
             COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
             COUNT(DISTINCT COALESCE(seeker_id, 0)) FILTER (WHERE seeker_id IS NOT NULL AND status = 'completed') AS unique_seekers
           FROM appointments
           WHERE guide_id = $1`,
          [userId]
        )
      )
    } else {
      // Seeker stats: study streak, events attending, community score, sessions completed
      sharedQueries.push(
        // 8a. Study streak
        pool.query(
          `SELECT COALESCE(current_streak, 0) AS current_streak
           FROM user_study_streaks WHERE user_id = $1`,
          [userId]
        ),
        // 8b. Events attending (future RSVP'd events)
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM event_rsvps er
           JOIN events e ON er.event_id = e.id
           WHERE er.user_id = $1 AND e.date_time > NOW()`,
          [userId]
        ),
        // 8c. Community score (calculated from activity across the app)
        pool.query(
          `SELECT (
             COALESCE((SELECT COUNT(*) FROM prayer_requests WHERE user_id = $1 AND type = 'prayer'), 0) * 2 +
             COALESCE((SELECT COUNT(*) FROM prayer_requests WHERE user_id = $1 AND type = 'testimony'), 0) * 2 +
             COALESCE((SELECT COUNT(*) FROM prayer_interactions WHERE user_id = $1), 0) +
             COALESCE((SELECT COUNT(*) FROM church_reviews WHERE user_id = $1), 0) * 2 +
             COALESCE((SELECT COUNT(*) FROM event_rsvps er JOIN events e ON er.event_id = e.id WHERE er.user_id = $1 AND e.date_time > NOW()), 0) +
             COALESCE((SELECT COUNT(*) FROM event_rsvps er JOIN events e ON er.event_id = e.id WHERE er.user_id = $1 AND e.date_time <= NOW()), 0) * 2 +
             COALESCE((SELECT COUNT(*) FROM user_connections WHERE (requester_id = $1 OR recipient_id = $1) AND status = 'accepted'), 0) +
             COALESCE((SELECT COUNT(DISTINCT conversation_id) FROM messages WHERE sender_id = $1), 0) +
             COALESCE((SELECT COALESCE(SUM(array_length(completed_days, 1)), 0) FROM user_reading_progress WHERE user_id = $1), 0) +
             COALESCE((SELECT COUNT(*) FROM user_memorization_stats WHERE user_id = $1 AND attempts > 0), 0)
           )::int AS score`,
          [userId]
        ),
        // 8d. Sessions completed (lifetime)
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM appointments
           WHERE seeker_id = $1 AND status = 'completed'`,
          [userId]
        ),
        // 8f. Featured / top-rated guides for "Top Guides" dashboard section
        pool.query(
          `SELECT u.id, u.name, u.avatar, u.photo_url, u.specialization,
                  u.denomination, u.state, u.city,
                  u.overall_rating, u.review_count, u.follower_count,
                  u.accepting_seekers, u.max_pending_requests,
                  COALESCE(pending.count, 0)::int AS pending_count
           FROM users u
           LEFT JOIN (
             SELECT guide_id, COUNT(*) AS count FROM appointments
             WHERE status = 'pending' GROUP BY guide_id
           ) pending ON pending.guide_id = u.id
           WHERE u.role = 'guide'
             AND u.overall_rating > 0
             AND u.review_count >= 1
             AND u.id != $1
             AND u.id NOT IN (
               SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
               UNION
               SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
             )
           ORDER BY u.overall_rating DESC, u.follower_count DESC
           LIMIT 5`,
          [userId]
        ),
        // 8e. Recent guide posts from connected OR followed guides (for "From Your Guides" section)
        pool.query(
          `SELECT gp.id, gp.title, gp.content, gp.post_type, gp.scripture_ref,
                  gp.like_count, gp.created_at, gp.user_id,
                  u.name AS user_name, u.avatar AS user_avatar, u.photo_url AS user_photo,
                  EXISTS(
                    SELECT 1 FROM guide_post_likes WHERE user_id = $1 AND post_id = gp.id
                  ) AS liked
           FROM guide_posts gp
           JOIN users u ON u.id = gp.user_id
           WHERE gp.user_id IN (
             -- Connected guides (mutual accepted connection)
             SELECT CASE WHEN uc.requester_id = $1 THEN uc.recipient_id ELSE uc.requester_id END
             FROM user_connections uc
             WHERE (uc.requester_id = $1 OR uc.recipient_id = $1) AND uc.status = 'accepted'
             UNION
             -- Followed guides (one-way follow)
             SELECT guide_id FROM guide_follows WHERE follower_id = $1
           )
           AND u.id NOT IN (
             SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
             UNION
             SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
           )
           ORDER BY gp.created_at DESC
           LIMIT 4`,
          [userId]
        )
      )
    }

    // Run all queries in parallel for speed
    const results = await Promise.all(sharedQueries)

    // Destructure shared results (first 7 are always the same)
    const [
      unreadResult, pendingConnResult, prayerActivityResult,
      pendingSessionsResult, upcomingResult, communityActivityResult,
      upcomingEventsResult, ...roleResults
    ] = results

    // Build role-specific sessionStats
    let sessionStats
    let guidePostsFromConnections = []
    let featuredGuides = []
    if (userRole === 'guide') {
      const guideStats = roleResults[0]
      sessionStats = {
        role: 'guide',
        upcoming: guideStats.rows[0].upcoming,
        completed: guideStats.rows[0].completed,
        uniqueSeekers: parseInt(guideStats.rows[0].unique_seekers)
      }
    } else {
      const [streakResult, eventsResult, scoreResult, sessionsResult, featuredGuidesResult, guidePostsResult] = roleResults
      sessionStats = {
        role: 'seeker',
        studyStreak: streakResult.rows[0]?.current_streak || 0,
        eventsAttending: eventsResult.rows[0].count,
        communityScore: parseInt(scoreResult.rows[0].score) || 0,
        sessionsCompleted: sessionsResult.rows[0].count
      }
      featuredGuides = featuredGuidesResult.rows.map(r => ({
        id: r.id,
        name: r.name,
        avatar: r.avatar,
        photoUrl: r.photo_url,
        specialization: r.specialization,
        denomination: r.denomination,
        state: r.state,
        city: r.city,
        overallRating: parseFloat(r.overall_rating),
        reviewCount: r.review_count,
        followerCount: r.follower_count,
        acceptingSeekers: r.accepting_seekers,
        pendingCount: r.pending_count,
        maxPendingRequests: r.max_pending_requests,
      }))
      guidePostsFromConnections = guidePostsResult.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        content: r.content,
        postType: r.post_type,
        scriptureRef: r.scripture_ref,
        likeCount: r.like_count,
        createdAt: r.created_at,
        liked: r.liked,
        userName: r.user_name,
        userAvatar: r.user_avatar,
        userPhoto: r.user_photo
      }))
    }

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
        displayName: a.display_name,
        seekerPhoto: a.seeker_photo || null,
        guidePhoto: a.guide_photo || null
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
      sessionStats,
      guidePostsFromConnections,
      featuredGuides,
      upcomingEvents: upcomingEventsResult.rows.map(e => ({
        id: e.id,
        title: e.title,
        dateTime: e.date_time,
        location: e.location,
        category: e.category,
        churchName: e.church_name
      }))
    })
  } catch (error) {
    next(error)
  }
})

export default router
