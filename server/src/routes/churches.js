// ============================================================
// Church Routes (includes Reviews & Announcements)
// ============================================================
// GET    /api/churches/search?q=term            - Search via Google Places API
// GET    /api/churches/photo/:googlePlaceId     - Proxy photo from Google Places
// POST   /api/churches/save-from-google         - Auto-save church from Google result
// GET    /api/churches                          - List all churches (with optional search)
// GET    /api/churches/:id                      - Get a single church's details
// GET    /api/churches/:id/members              - Get people at this church
// GET    /api/churches/:id/reviews              - List reviews for a church
// POST   /api/churches/:id/reviews              - Submit a review
// PUT    /api/churches/:id/reviews              - Update own review
// DELETE /api/churches/:id/reviews              - Delete own review
// GET    /api/churches/:id/announcements        - Get bulletin board announcements
// POST   /api/churches/:id/announcements        - Create announcement (guides only)
// DELETE /api/churches/:id/announcements/:annId - Delete announcement (author only)
//
// Photo route is unauthenticated (img tags can't send JWT).
// All other routes require JWT token.
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'
import { createNotification } from '../utils/createNotification.js'
import STATE_NAMES from '../utils/stateMap.js'

const router = Router()

// Reverse lookup: full name → abbreviation (for parsing "Chicago Illinois" → IL)
const STATE_ABBRS = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([abbr, name]) => [name.toLowerCase(), abbr])
)

// Parse a search query to detect "city, state" patterns.
// Returns { city, state, stateFull } if detected, or {} if single-term.
// Handles: "Chicago, IL", "Chicago Illinois", "chicago, illinois", "Austin TX", etc.
function parseSearchQuery(query) {
  // Try comma-separated first: "Chicago, IL" or "Chicago, Illinois"
  if (query.includes(',')) {
    const parts = query.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length === 2) {
      const maybeState = parts[1]
      const abbr = maybeState.toUpperCase()
      if (STATE_NAMES[abbr]) {
        return { city: parts[0], state: abbr, stateFull: STATE_NAMES[abbr] }
      }
      const abbrFromFull = STATE_ABBRS[maybeState.toLowerCase()]
      if (abbrFromFull) {
        return { city: parts[0], state: abbrFromFull, stateFull: maybeState }
      }
    }
  }

  // Try space-separated: check if last word(s) match a state
  const words = query.split(/\s+/)
  if (words.length >= 2) {
    // Check if last word is a 2-letter state abbreviation
    const lastWord = words[words.length - 1].toUpperCase()
    if (lastWord.length === 2 && STATE_NAMES[lastWord]) {
      const cityPart = words.slice(0, -1).join(' ')
      return { city: cityPart, state: lastWord, stateFull: STATE_NAMES[lastWord] }
    }

    // Check if last 1-2 words match a full state name
    // e.g., "Chicago Illinois" or "Austin New Mexico"
    const lastOne = words[words.length - 1].toLowerCase()
    const lastTwo = words.length >= 3 ? words.slice(-2).join(' ').toLowerCase() : null

    if (lastTwo && STATE_ABBRS[lastTwo]) {
      const cityPart = words.slice(0, -2).join(' ')
      return { city: cityPart, state: STATE_ABBRS[lastTwo], stateFull: words.slice(-2).join(' ') }
    }
    if (STATE_ABBRS[lastOne]) {
      const cityPart = words.slice(0, -1).join(' ')
      return { city: cityPart, state: STATE_ABBRS[lastOne], stateFull: words[words.length - 1] }
    }
  }

  return {}
}

// ============================================================
// UNAUTHENTICATED ROUTES (must come before router.use(authenticate))
// ============================================================

// GET /api/churches/photo/:googlePlaceId
// Proxies a church photo from Google Places API.
// Unauthenticated because <img src="..."> tags can't send JWT headers.
// Church photos are public data (available on Google anyway).
router.get('/photo/:googlePlaceId', async (req, res, next) => {
  try {
    const { googlePlaceId } = req.params
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      return res.status(503).json({ error: 'Photo service unavailable' })
    }

    // Step 1: Get the place details to find photo references
    const detailsResponse = await fetch(
      `https://places.googleapis.com/v1/places/${googlePlaceId}`,
      {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'photos'
        }
      }
    )

    if (!detailsResponse.ok) {
      return res.status(404).json({ error: 'Place not found' })
    }

    const detailsData = await detailsResponse.json()

    if (!detailsData.photos || detailsData.photos.length === 0) {
      return res.status(404).json({ error: 'No photo available' })
    }

    // Step 2: Fetch the actual photo using the first photo reference
    const photoName = detailsData.photos[0].name
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=400&key=${apiKey}`
    const photoResponse = await fetch(photoUrl)

    if (!photoResponse.ok) {
      return res.status(502).json({ error: 'Failed to fetch photo' })
    }

    // Stream the image back to the client
    const contentType = photoResponse.headers.get('content-type') || 'image/jpeg'
    res.set('Content-Type', contentType)
    res.set('Cache-Control', 'public, max-age=86400') // Browser caches for 24 hours

    const buffer = await photoResponse.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (error) {
    console.error('Photo proxy error:', error.message)
    next(error)
  }
})

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================
router.use(authenticate)

// Helper: transform a database row to match the frontend's expected format
// Category averages are stored as avg_worship, avg_sermon, etc. on the churches table.
// These are computed from individual review ratings via recalculateChurchRating().
function formatChurch(row) {
  const toFloat = (val) => val != null ? parseFloat(val) : null
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    zip: row.zip,
    phone: row.phone,
    website: row.website,
    shortDescription: row.short_description,
    photoUrl: row.photo_url,
    googlePlaceId: row.google_place_id,
    sundaySchool: row.sunday_school,
    recommendedAges: row.recommended_ages,
    hours: row.hours,
    googleRating: toFloat(row.google_rating),
    categoryRatings: {
      worship:    toFloat(row.avg_worship),
      sermon:     toFloat(row.avg_sermon),
      community:  toFloat(row.avg_community),
      youth:      toFloat(row.avg_youth),
      children:   toFloat(row.avg_children),
      bibleStudy: toFloat(row.avg_biblestudy),
      parking:    toFloat(row.avg_parking),
      facilities: toFloat(row.avg_facilities),
    },
    overallRating: parseFloat(row.overall_rating),
    reviewCount: row.review_count,
    rated: true
  }
}

// ============================================================
// GET /api/churches/search?q=term
// ============================================================
// Searches Google Places API for churches, then checks our local
// database for each result to merge in Sanctuary ratings.
//
// This is the main search endpoint the frontend uses. It replaces
// the old local-only search for the search flow.
//
// Returns: { results: [{ googlePlaceId, name, address, ... sanctuaryId, sanctuaryRating }] }

router.get('/search', async (req, res, next) => {
  try {
    const { q } = req.query
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!q || !q.trim()) {
      return res.json({ results: [] })
    }

    if (!apiKey) {
      return res.status(503).json({ error: 'Search service unavailable' })
    }

    // Search Google Places for churches matching the query
    const searchResponse = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.photos,places.addressComponents,places.regularOpeningHours'
        },
        body: JSON.stringify({
          // Append "churches" if the query doesn't already mention it,
          // so users can search by just city name (e.g. "St. Louis")
          textQuery: /church/i.test(q) ? q : `${q} churches`,
          languageCode: 'en'
        })
      }
    )

    if (!searchResponse.ok) {
      const errText = await searchResponse.text()
      console.error('Google Places search failed:', searchResponse.status, errText)
      return res.status(502).json({ error: 'Search service error' })
    }

    const searchData = await searchResponse.json()
    const places = searchData.places || []

    // For each Google result, check if we have it in our database
    const results = []
    for (const place of places) {
      // Parse city and state from addressComponents
      let city = ''
      let state = ''
      let zip = ''
      if (place.addressComponents) {
        for (const comp of place.addressComponents) {
          if (comp.types?.includes('locality')) city = comp.longText || ''
          if (comp.types?.includes('administrative_area_level_1')) state = comp.shortText || ''
          if (comp.types?.includes('postal_code')) zip = comp.longText || ''
        }
      }

      // Check our local database for this church
      let sanctuaryId = null
      let sanctuaryRating = null
      let sanctuaryReviewCount = 0

      const localResult = await pool.query(
        'SELECT id, overall_rating, review_count FROM churches WHERE google_place_id = $1',
        [place.id]
      )

      if (localResult.rows.length > 0) {
        const local = localResult.rows[0]
        sanctuaryId = local.id
        sanctuaryRating = parseFloat(local.overall_rating)
        sanctuaryReviewCount = local.review_count
      }

      results.push({
        googlePlaceId: place.id,
        name: place.displayName?.text || 'Unknown Church',
        address: place.formattedAddress || '',
        city,
        state,
        zip,
        phone: place.nationalPhoneNumber || null,
        website: place.websiteUri || null,
        googleRating: place.rating || null,
        hasPhoto: !!(place.photos && place.photos.length > 0),
        hours: place.regularOpeningHours?.weekdayDescriptions || null,
        sanctuaryId,
        sanctuaryRating,
        sanctuaryReviewCount
      })
    }

    res.json({ results })
  } catch (error) {
    console.error('Church search error:', error.message)
    next(error)
  }
})

// ============================================================
// POST /api/churches/save-from-google
// ============================================================
// When a user taps a church from Google search results that isn't
// already in our database, this endpoint saves it automatically.
// The church then exists in Sanctuary permanently with zero reviews
// and an empty bulletin board.
//
// If the church already exists (matched by google_place_id),
// returns the existing church instead of creating a duplicate.

router.post('/save-from-google', async (req, res, next) => {
  try {
    const { googlePlaceId, name, address, city, state, zip, phone, website, hours, googleRating } = req.body

    if (!googlePlaceId || !name) {
      return res.status(400).json({ error: 'googlePlaceId and name are required.' })
    }

    // Check if this church already exists
    const existing = await pool.query(
      'SELECT * FROM churches WHERE google_place_id = $1',
      [googlePlaceId]
    )

    if (existing.rows.length > 0) {
      return res.json({ church: formatChurch(existing.rows[0]) })
    }

    // Insert new church
    const result = await pool.query(
      `INSERT INTO churches (name, address, city, state, zip, phone, website, hours, google_place_id, google_rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        address || '',
        city || '',
        state || '',
        zip || '',
        phone || null,
        website || null,
        hours || null,
        googlePlaceId,
        googleRating || null
      ]
    )

    res.status(201).json({ church: formatChurch(result.rows[0]) })
  } catch (error) {
    // Handle race condition: if two users tap the same church simultaneously
    if (error.code === '23505') {
      const existing = await pool.query(
        'SELECT * FROM churches WHERE google_place_id = $1',
        [req.body.googlePlaceId]
      )
      return res.json({ church: formatChurch(existing.rows[0]) })
    }
    next(error)
  }
})

// ============================================================
// GET /api/churches
// ============================================================
// Returns churches with pagination. Supports search by name,
// city, state, or ZIP code.
//
// Query params:
//   ?q=       - Search term (filters by name, city, state, or zip)
//   ?limit=   - How many to return (default 5)
//   ?offset=  - How many to skip (default 0, used for "show more")
//
// Response includes { churches, hasMore, total } so the frontend
// knows whether to show a "Show More" button.

router.get('/', async (req, res, next) => {
  try {
    const { q, state, city, preferredChurchId } = req.query
    const limit = parseInt(req.query.limit) || 20
    const offset = parseInt(req.query.offset) || 0

    let baseQuery = 'FROM churches'
    const conditions = []
    const params = []

    if (q) {
      // Smart query parsing: detect "city state" patterns
      // Handles: "Chicago, Illinois", "Chicago IL", "chicago illinois", etc.
      const parsed = parseSearchQuery(q.trim())

      if (parsed.city && parsed.state) {
        // Two-part query: search city AND state together
        const idx1 = params.length + 1
        const idx2 = params.length + 2
        const idx3 = params.length + 3
        params.push(`%${parsed.city}%`, parsed.state, parsed.stateFull)
        conditions.push(`(city ILIKE $${idx1} AND (state = $${idx2} OR state ILIKE $${idx3}))`)
      } else {
        // Single-term query: search across all columns (existing behavior)
        const idx1 = params.length + 1
        const idx2 = params.length + 2
        const idx3 = params.length + 3
        const idx4 = params.length + 4
        params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`)
        // Also check if the single term is a state name/abbreviation
        const stateAbbr = Object.keys(STATE_NAMES).find(k => k.toLowerCase() === q.trim().toLowerCase())
        const stateFull = Object.values(STATE_NAMES).find(v => v.toLowerCase() === q.trim().toLowerCase())
        if (stateAbbr || stateFull) {
          // It's a state — match both abbreviation and full name
          const idx5 = params.length + 1
          const idx6 = params.length + 2
          params.push(stateAbbr || q.trim(), stateFull || STATE_NAMES[stateAbbr] || q.trim())
          conditions.push(`(city ILIKE $${idx1} OR state ILIKE $${idx2} OR zip LIKE $${idx3} OR name ILIKE $${idx4} OR state = $${idx5} OR state = $${idx6})`)
        } else {
          conditions.push(`(city ILIKE $${idx1} OR state ILIKE $${idx2} OR zip LIKE $${idx3} OR name ILIKE $${idx4})`)
        }
      }
    } else if (state) {
      // Location-based filtering: match both abbreviation and full name
      // because seeded churches use "Illinois" but Google-saved use "IL"
      const fullName = STATE_NAMES[state.toUpperCase()] || state
      params.push(state, fullName)
      conditions.push(`(state = $1 OR state = $2)`)
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ')
    }

    // Get total count of matching churches
    const countResult = await pool.query(`SELECT COUNT(*) ${baseQuery}`, params)
    const total = parseInt(countResult.rows[0].count)

    // Build ORDER BY: if city provided, prioritize city matches first
    let orderClause = 'ORDER BY (photo_url IS NULL) ASC, name ASC'
    if (city && state && !q) {
      const cityIdx = params.length + 1
      params.push(city)
      orderClause = `ORDER BY (LOWER(city) = LOWER($${cityIdx})) DESC, (photo_url IS NULL) ASC, name ASC`
    }

    // Get the paginated results
    const limitIdx = params.length + 1
    const offsetIdx = params.length + 2
    const dataParams = [...params, limit, offset]
    const result = await pool.query(
      `SELECT * ${baseQuery} ${orderClause} LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      dataParams
    )
    const churches = result.rows.map(formatChurch)

    // If preferredChurchId provided, fetch it separately
    let preferred = null
    if (preferredChurchId) {
      const prefResult = await pool.query('SELECT * FROM churches WHERE id = $1', [preferredChurchId])
      if (prefResult.rows.length > 0) {
        preferred = formatChurch(prefResult.rows[0])
      }
    }

    res.json({
      churches,
      preferred,
      total,
      hasMore: offset + churches.length < total
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/churches/:id
// ============================================================
// Returns a single church by ID.
//
// Replaces: allChurches.find(c => c.id === ...) in ChurchDetail screen

router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params

    const result = await pool.query('SELECT * FROM churches WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Church not found.' })
    }

    res.json({ church: formatChurch(result.rows[0]) })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/churches/:id/congregation
// ============================================================
// Returns the logged-in user's accepted connections who are
// affiliated with this church (favorited, reviewed, or set as
// their preferred church). Shown as "Your Connections Here".

router.get('/:id/congregation', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    const result = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.avatar, u.photo_url, u.role
      FROM users u
      JOIN user_connections uc ON (
        (uc.requester_id = $1 AND uc.recipient_id = u.id)
        OR (uc.recipient_id = $1 AND uc.requester_id = u.id)
      )
      WHERE uc.status = 'accepted'
        AND (
          u.id IN (SELECT user_id FROM church_favorites WHERE church_id = $2)
          OR u.id IN (SELECT user_id FROM church_reviews WHERE church_id = $2)
          OR u.preferred_church_id = $2
        )
        AND u.id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
        )
      ORDER BY u.name ASC
    `, [userId, id])

    const connections = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      photoUrl: row.photo_url,
      role: row.role.charAt(0).toUpperCase() + row.role.slice(1)
    }))

    res.json({ connections })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/churches/:id/members
// ============================================================
// Returns users who have favorited OR reviewed this church.
// Excludes the current user and already-connected users.
// Returns limited fields + shared interests count.

router.get('/:id/members', async (req, res, next) => {
  try {
    const { id } = req.params
    const userId = req.user.id

    // Get current user's interests for shared count
    const meResult = await pool.query('SELECT interests FROM users WHERE id = $1', [userId])
    const myInterests = meResult.rows[0]?.interests || []

    // Find users who favorited or reviewed this church, excluding:
    // - the current user
    // - users already connected (accepted) or pending with current user
    const result = await pool.query(`
      SELECT DISTINCT u.id, u.name, u.avatar, u.photo_url, u.role, u.interests
      FROM users u
      WHERE u.id != $1
        AND (
          u.id IN (SELECT user_id FROM church_favorites WHERE church_id = $2)
          OR u.id IN (SELECT user_id FROM church_reviews WHERE church_id = $2)
        )
        AND u.id NOT IN (
          SELECT CASE WHEN requester_id = $1 THEN recipient_id ELSE requester_id END
          FROM user_connections
          WHERE (requester_id = $1 OR recipient_id = $1)
            AND status IN ('accepted', 'pending')
        )
        AND u.id NOT IN (
          SELECT blocked_id FROM user_blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id FROM user_blocks WHERE blocked_id = $1
        )
      ORDER BY u.name ASC
    `, [userId, id])

    const members = result.rows.map(row => {
      const theirInterests = row.interests || []
      const sharedCount = myInterests.filter(i => theirInterests.includes(i)).length
      return {
        id: row.id,
        name: row.name,
        avatar: row.avatar,
        photoUrl: row.photo_url,
        role: row.role.charAt(0).toUpperCase() + row.role.slice(1),
        sharedInterests: sharedCount
      }
    })

    res.json({ members })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// REVIEWS
// ============================================================

// Helper: recalculate a church's overall rating + category averages from reviews.
// PostgreSQL AVG() ignores NULLs, so categories only reflect reviews that rated them.
async function recalculateChurchRating(churchId) {
  const result = await pool.query(
    `SELECT
       COUNT(*) as review_count,
       COALESCE(AVG(rating), 0) as avg_overall,
       AVG(rating_worship) as avg_worship,
       AVG(rating_sermon) as avg_sermon,
       AVG(rating_community) as avg_community,
       AVG(rating_youth) as avg_youth,
       AVG(rating_children) as avg_children,
       AVG(rating_biblestudy) as avg_biblestudy,
       AVG(rating_parking) as avg_parking,
       AVG(rating_facilities) as avg_facilities
     FROM church_reviews WHERE church_id = $1`,
    [churchId]
  )

  const row = result.rows[0]
  const toDecimal = (val) => val != null ? parseFloat(val).toFixed(1) : null

  await pool.query(
    `UPDATE churches SET
       overall_rating = $1, review_count = $2,
       avg_worship = $3, avg_sermon = $4, avg_community = $5,
       avg_youth = $6, avg_children = $7, avg_biblestudy = $8,
       avg_parking = $9, avg_facilities = $10
     WHERE id = $11`,
    [
      toDecimal(row.avg_overall) || 0,
      parseInt(row.review_count),
      toDecimal(row.avg_worship),
      toDecimal(row.avg_sermon),
      toDecimal(row.avg_community),
      toDecimal(row.avg_youth),
      toDecimal(row.avg_children),
      toDecimal(row.avg_biblestudy),
      toDecimal(row.avg_parking),
      toDecimal(row.avg_facilities),
      churchId
    ]
  )
}

// GET /api/churches/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.rating, r.review_text, r.created_at, r.updated_at,
              r.rating_worship, r.rating_sermon, r.rating_community, r.rating_youth,
              r.rating_children, r.rating_biblestudy, r.rating_parking, r.rating_facilities,
              r.user_id, u.name as user_name, u.avatar as user_avatar, u.photo_url as user_photo
       FROM church_reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.church_id = $1
         AND u.id NOT IN (
           SELECT blocked_id FROM user_blocks WHERE blocker_id = $2
           UNION
           SELECT blocker_id FROM user_blocks WHERE blocked_id = $2
         )
       ORDER BY r.created_at DESC`,
      [req.params.id, req.user.id]
    )

    const reviews = result.rows.map(r => ({
      id: r.id,
      rating: r.rating,
      text: r.review_text,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      userId: r.user_id,
      userName: r.user_name,
      userAvatar: r.user_avatar,
      userPhoto: r.user_photo,
      categories: {
        worship: r.rating_worship,
        sermon: r.rating_sermon,
        community: r.rating_community,
        youth: r.rating_youth,
        children: r.rating_children,
        bibleStudy: r.rating_biblestudy,
        parking: r.rating_parking,
        facilities: r.rating_facilities,
      }
    }))

    res.json({ reviews })
  } catch (error) {
    next(error)
  }
})

// POST /api/churches/:id/reviews
// Accepts { categories: { worship: 5, sermon: 4, ... }, text: "..." }
// All categories are optional but at least one must be rated.
// The overall `rating` is computed as the rounded average of rated categories.
router.post('/:id/reviews', async (req, res, next) => {
  try {
    const { categories, text } = req.body
    const churchId = req.params.id

    // Extract category values, validate each is 1-5 or null
    const cats = categories || {}
    const catKeys = ['worship', 'sermon', 'community', 'youth', 'children', 'bibleStudy', 'parking', 'facilities']
    const catValues = {}
    const ratedValues = []

    for (const key of catKeys) {
      const val = cats[key]
      if (val != null) {
        if (val < 1 || val > 5 || !Number.isInteger(val)) {
          return res.status(400).json({ error: `${key} rating must be an integer between 1 and 5.` })
        }
        catValues[key] = val
        ratedValues.push(val)
      } else {
        catValues[key] = null
      }
    }

    if (ratedValues.length === 0) {
      return res.status(400).json({ error: 'Please rate at least one category.' })
    }

    // Compute overall rating from rated categories
    const overall = Math.round(ratedValues.reduce((a, b) => a + b, 0) / ratedValues.length)

    const result = await pool.query(
      `INSERT INTO church_reviews (user_id, church_id, rating, review_text,
         rating_worship, rating_sermon, rating_community, rating_youth,
         rating_children, rating_biblestudy, rating_parking, rating_facilities)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, rating, review_text, created_at`,
      [
        req.user.id, churchId, overall, text || null,
        catValues.worship, catValues.sermon, catValues.community, catValues.youth,
        catValues.children, catValues.bibleStudy, catValues.parking, catValues.facilities
      ]
    )

    await recalculateChurchRating(churchId)

    const r = result.rows[0]
    res.status(201).json({
      review: {
        id: r.id,
        rating: r.rating,
        text: r.review_text,
        createdAt: r.created_at
      }
    })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ error: 'You have already reviewed this church.' })
    }
    next(error)
  }
})

// PUT /api/churches/:id/reviews
// Same category format as POST — updates all category columns + recomputes overall.
router.put('/:id/reviews', async (req, res, next) => {
  try {
    const { categories, text } = req.body
    const churchId = req.params.id

    const cats = categories || {}
    const catKeys = ['worship', 'sermon', 'community', 'youth', 'children', 'bibleStudy', 'parking', 'facilities']
    const catValues = {}
    const ratedValues = []

    for (const key of catKeys) {
      const val = cats[key]
      if (val != null) {
        if (val < 1 || val > 5 || !Number.isInteger(val)) {
          return res.status(400).json({ error: `${key} rating must be an integer between 1 and 5.` })
        }
        catValues[key] = val
        ratedValues.push(val)
      } else {
        catValues[key] = null
      }
    }

    if (ratedValues.length === 0) {
      return res.status(400).json({ error: 'Please rate at least one category.' })
    }

    const overall = Math.round(ratedValues.reduce((a, b) => a + b, 0) / ratedValues.length)

    const result = await pool.query(
      `UPDATE church_reviews SET
         rating = $1, review_text = $2, updated_at = NOW(),
         rating_worship = $3, rating_sermon = $4, rating_community = $5, rating_youth = $6,
         rating_children = $7, rating_biblestudy = $8, rating_parking = $9, rating_facilities = $10
       WHERE user_id = $11 AND church_id = $12
       RETURNING id, rating, review_text, created_at, updated_at`,
      [
        overall, text || null,
        catValues.worship, catValues.sermon, catValues.community, catValues.youth,
        catValues.children, catValues.bibleStudy, catValues.parking, catValues.facilities,
        req.user.id, churchId
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' })
    }

    await recalculateChurchRating(churchId)

    const r = result.rows[0]
    res.json({
      review: {
        id: r.id,
        rating: r.rating,
        text: r.review_text,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }
    })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/churches/:id/reviews
router.delete('/:id/reviews', async (req, res, next) => {
  try {
    const churchId = req.params.id
    const result = await pool.query(
      'DELETE FROM church_reviews WHERE user_id = $1 AND church_id = $2 RETURNING id',
      [req.user.id, churchId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' })
    }

    await recalculateChurchRating(churchId)

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// ANNOUNCEMENTS
// ============================================================

// GET /api/churches/:id/announcements
// Returns bulletin board announcements for a church, newest first.

router.get('/:id/announcements', async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT ca.id, ca.title, ca.message, ca.category, ca.created_at,
             u.name AS author_name, u.avatar AS author_avatar, u.photo_url AS author_photo
      FROM church_announcements ca
      JOIN users u ON u.id = ca.author_id
      WHERE ca.church_id = $1
      ORDER BY ca.created_at DESC
    `, [req.params.id])

    const announcements = result.rows.map(r => ({
      id: r.id,
      title: r.title,
      message: r.message,
      category: r.category,
      createdAt: r.created_at,
      authorName: r.author_name,
      authorAvatar: r.author_avatar,
      authorPhoto: r.author_photo
    }))

    res.json({ announcements })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/churches/:id/announcements
// ============================================================
// Create a new announcement (guides only).

const VALID_ANNOUNCEMENT_CATEGORIES = ['Announcement', 'Upcoming Sermon', 'Schedule Change', 'Church Need', 'Event']

router.post('/:id/announcements', async (req, res, next) => {
  try {
    if (req.user.role !== 'guide') {
      return res.status(403).json({ error: 'Only guides can post announcements.' })
    }

    const { title, message, category } = req.body

    if (!title || !message || !category) {
      return res.status(400).json({ error: 'Title, message, and category are required.' })
    }

    if (!VALID_ANNOUNCEMENT_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'Invalid announcement category.' })
    }

    const result = await pool.query(
      `INSERT INTO church_announcements (church_id, author_id, title, message, category)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, message, category, created_at`,
      [req.params.id, req.user.id, title, message, category]
    )

    const r = result.rows[0]

    // Notify all users who favorited this church
    const churchInfo = await pool.query('SELECT name FROM churches WHERE id = $1', [req.params.id])
    const favResult = await pool.query(
      'SELECT user_id FROM church_favorites WHERE church_id = $1',
      [req.params.id]
    )
    const io = req.app.get('io')
    for (const fav of favResult.rows) {
      await createNotification(io, {
        userId: fav.user_id,
        actorId: req.user.id,
        type: 'church_announcement',
        title: `New announcement from ${churchInfo.rows[0].name}`,
        body: title,
        referenceType: 'church',
        referenceId: parseInt(req.params.id)
      })
    }

    res.status(201).json({
      announcement: {
        id: r.id,
        title: r.title,
        message: r.message,
        category: r.category,
        createdAt: r.created_at,
        authorName: req.user.name,
        authorAvatar: req.user.avatar,
        authorPhoto: req.user.photoUrl
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/churches/:id/announcements/:annId
// ============================================================
// Delete an announcement (author only).

router.delete('/:id/announcements/:annId', async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM church_announcements WHERE id = $1 AND author_id = $2 RETURNING id',
      [req.params.annId, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Announcement not found or not yours.' })
    }

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default router
