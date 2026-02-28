// ============================================================
// Church Auth Routes - Register, Login & Church Management
// ============================================================
// POST   /api/church-auth/register       - Create a new church account
// POST   /api/church-auth/login          - Log in as a church
// GET    /api/church-auth/me             - Get church account profile
// PUT    /api/church-auth/profile        - Update church profile
// GET    /api/church-auth/congregation   - View church members
// POST   /api/church-auth/verify-guide   - Add a verified guide
// DELETE /api/church-auth/verify-guide/:guideId - Remove a verified guide
// GET    /api/church-auth/search-guides  - Search guides by name
// ============================================================

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import pool from '../config/db.js'
import { authenticateChurch } from '../middleware/churchAuth.js'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()

// Rate limiter: max 10 login attempts per IP per 15 minutes
const churchLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Helper: create a church-specific JWT token
function createChurchToken(churchAccountId, churchId) {
  return jwt.sign(
    { churchAccountId, churchId, type: 'church' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// ============================================================
// POST /api/church-auth/register
// ============================================================
// Creates a new church account (starts as 'pending').
// Body: { email, password, churchId, displayName, guideId }

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, churchId, displayName, guideId } = req.body

    // Validate required fields
    if (!email || !password || !churchId || !displayName || !guideId) {
      return res.status(400).json({ error: 'Email, password, church, display name, and a linked guide are all required.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' })
    }

    // Verify the church exists
    const churchCheck = await pool.query('SELECT id FROM churches WHERE id = $1', [churchId])
    if (churchCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Church not found.' })
    }

    // Check church not already claimed
    const claimCheck = await pool.query('SELECT id FROM church_accounts WHERE church_id = $1', [churchId])
    if (claimCheck.rows.length > 0) {
      return res.status(400).json({ error: 'This church already has an account.' })
    }

    // Check email not already taken (in church_accounts, NOT users)
    const emailCheck = await pool.query('SELECT id FROM church_accounts WHERE email = $1', [email.toLowerCase().trim()])
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already in use by another church account.' })
    }

    // Verify the guide exists and has role='guide'
    const guideCheck = await pool.query("SELECT id, name FROM users WHERE id = $1 AND role = 'guide'", [guideId])
    if (guideCheck.rows.length === 0) {
      return res.status(400).json({ error: 'The linked guide must be a registered guide on Sanctuary.' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create the church account (status = 'pending')
    const result = await pool.query(
      `INSERT INTO church_accounts (church_id, email, password_hash, display_name, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id`,
      [churchId, email.toLowerCase().trim(), passwordHash, displayName]
    )

    const accountId = result.rows[0].id

    // Link the guide
    await pool.query(
      'INSERT INTO church_account_guides (church_account_id, guide_id) VALUES ($1, $2)',
      [accountId, guideId]
    )

    // Set managed_by on the church
    await pool.query('UPDATE churches SET managed_by = $1 WHERE id = $2', [accountId, churchId])

    res.status(201).json({ message: 'Church account created. Pending verification.' })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/church-auth/login
// ============================================================
// Logs in a church account.
// Body: { email, password }

router.post('/login', churchLoginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    // Look up church account
    const result = await pool.query(
      `SELECT ca.id, ca.church_id, ca.email, ca.password_hash, ca.display_name, ca.status,
              ca.onboarding_completed,
              c.name AS church_name, c.google_place_id, c.overall_rating, c.review_count
       FROM church_accounts ca
       JOIN churches c ON c.id = ca.church_id
       WHERE ca.email = $1`,
      [email.toLowerCase().trim()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const account = result.rows[0]

    // Check status
    if (account.status === 'pending') {
      return res.status(403).json({ error: 'Your church account is pending verification. Please check back within 48 hours.' })
    }
    if (account.status === 'suspended') {
      return res.status(403).json({ error: 'This church account has been suspended.' })
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, account.password_hash)
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Create token
    const token = createChurchToken(account.id, account.church_id)

    res.json({
      token,
      churchAccount: {
        accountId: account.id,
        churchId: account.church_id,
        churchName: account.church_name,
        displayName: account.display_name,
        email: account.email,
        googlePlaceId: account.google_place_id,
        overallRating: account.overall_rating,
        reviewCount: account.review_count,
        status: account.status,
        onboardingCompleted: account.onboarding_completed
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/church-auth/me
// ============================================================
// Returns the church account profile + church details + linked guides.

router.get('/me', authenticateChurch, async (req, res, next) => {
  try {
    const { accountId, churchId } = req.church

    // Get account + church data
    const acctResult = await pool.query(
      `SELECT ca.id, ca.email, ca.display_name, ca.status, ca.onboarding_completed,
              c.id AS church_id, c.name, c.address, c.city, c.state,
              c.custom_description, c.custom_hours, c.custom_programs,
              c.google_place_id, c.overall_rating, c.review_count,
              c.google_rating, c.short_description, c.hours
       FROM church_accounts ca
       JOIN churches c ON c.id = ca.church_id
       WHERE ca.id = $1`,
      [accountId]
    )

    if (acctResult.rows.length === 0) {
      return res.status(404).json({ error: 'Church account not found.' })
    }

    const data = acctResult.rows[0]

    // Get linked guides
    const guidesResult = await pool.query(
      `SELECT u.id, u.name, u.photo_url, u.avatar
       FROM church_account_guides cag
       JOIN users u ON u.id = cag.guide_id
       WHERE cag.church_account_id = $1
       ORDER BY u.name`,
      [accountId]
    )

    // Count congregation (users who favorited, reviewed, or have this as preferred church)
    const memberCountResult = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS count
       FROM users u
       WHERE u.id IN (
         SELECT user_id FROM church_favorites WHERE church_id = $1
         UNION
         SELECT user_id FROM church_reviews WHERE church_id = $1
         UNION
         SELECT id FROM users WHERE preferred_church_id = $1
       )`,
      [churchId]
    )

    const reviewCountResult = await pool.query(
      'SELECT COUNT(*) AS count FROM church_reviews WHERE church_id = $1',
      [churchId]
    )

    res.json({
      churchAccount: {
        accountId: data.id,
        email: data.email,
        displayName: data.display_name,
        status: data.status,
        onboardingCompleted: data.onboarding_completed,
        church: {
          id: data.church_id,
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          customDescription: data.custom_description,
          customHours: data.custom_hours,
          customPrograms: data.custom_programs,
          shortDescription: data.short_description,
          hours: data.hours,
          googlePlaceId: data.google_place_id,
          overallRating: data.overall_rating,
          reviewCount: data.review_count,
          googleRating: data.google_rating
        },
        guides: guidesResult.rows.map(g => ({
          id: g.id,
          name: g.name,
          photoUrl: g.photo_url,
          avatar: g.avatar
        })),
        stats: {
          memberCount: parseInt(memberCountResult.rows[0].count),
          reviewCount: parseInt(reviewCountResult.rows[0].count)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PUT /api/church-auth/profile
// ============================================================
// Updates the church profile (display name, description, hours, programs).

router.put('/profile', authenticateChurch, async (req, res, next) => {
  try {
    const { accountId, churchId } = req.church
    const { displayName, customDescription, customHours, customPrograms, onboardingCompleted } = req.body

    // Update church_accounts fields if provided
    if (displayName !== undefined || onboardingCompleted !== undefined) {
      const acctFields = []
      const acctValues = []
      let acctIdx = 1
      if (displayName !== undefined) {
        acctFields.push(`display_name = $${acctIdx++}`)
        acctValues.push(displayName)
      }
      if (onboardingCompleted !== undefined) {
        acctFields.push(`onboarding_completed = $${acctIdx++}`)
        acctValues.push(onboardingCompleted)
      }
      acctFields.push(`updated_at = NOW()`)
      acctValues.push(accountId)
      await pool.query(
        `UPDATE church_accounts SET ${acctFields.join(', ')} WHERE id = $${acctIdx}`,
        acctValues
      )
    }

    // Update custom fields on churches table
    const fields = []
    const values = []
    let idx = 1

    if (customDescription !== undefined) {
      fields.push(`custom_description = $${idx++}`)
      values.push(customDescription)
    }
    if (customHours !== undefined) {
      fields.push(`custom_hours = $${idx++}`)
      values.push(customHours)
    }
    if (customPrograms !== undefined) {
      fields.push(`custom_programs = $${idx++}`)
      values.push(customPrograms)
    }

    if (fields.length > 0) {
      values.push(churchId)
      await pool.query(
        `UPDATE churches SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      )
    }

    // Return the updated profile (reuse /me logic)
    // Redirect internally by re-calling the same query
    const acctResult = await pool.query(
      `SELECT ca.id, ca.email, ca.display_name, ca.status, ca.onboarding_completed,
              c.id AS church_id, c.name, c.address, c.city, c.state,
              c.custom_description, c.custom_hours, c.custom_programs,
              c.google_place_id, c.overall_rating, c.review_count,
              c.google_rating, c.short_description, c.hours
       FROM church_accounts ca
       JOIN churches c ON c.id = ca.church_id
       WHERE ca.id = $1`,
      [accountId]
    )

    const data = acctResult.rows[0]

    const guidesResult = await pool.query(
      `SELECT u.id, u.name, u.photo_url, u.avatar
       FROM church_account_guides cag
       JOIN users u ON u.id = cag.guide_id
       WHERE cag.church_account_id = $1
       ORDER BY u.name`,
      [accountId]
    )

    const memberCountResult = await pool.query(
      `SELECT COUNT(DISTINCT u.id) AS count
       FROM users u
       WHERE u.id IN (
         SELECT user_id FROM church_favorites WHERE church_id = $1
         UNION
         SELECT user_id FROM church_reviews WHERE church_id = $1
         UNION
         SELECT id FROM users WHERE preferred_church_id = $1
       )`,
      [churchId]
    )

    const reviewCountResult = await pool.query(
      'SELECT COUNT(*) AS count FROM church_reviews WHERE church_id = $1',
      [churchId]
    )

    res.json({
      churchAccount: {
        accountId: data.id,
        email: data.email,
        displayName: data.display_name,
        status: data.status,
        onboardingCompleted: data.onboarding_completed,
        church: {
          id: data.church_id,
          name: data.name,
          address: data.address,
          city: data.city,
          state: data.state,
          customDescription: data.custom_description,
          customHours: data.custom_hours,
          customPrograms: data.custom_programs,
          shortDescription: data.short_description,
          hours: data.hours,
          googlePlaceId: data.google_place_id,
          overallRating: data.overall_rating,
          reviewCount: data.review_count,
          googleRating: data.google_rating
        },
        guides: guidesResult.rows.map(g => ({
          id: g.id,
          name: g.name,
          photoUrl: g.photo_url,
          avatar: g.avatar
        })),
        stats: {
          memberCount: parseInt(memberCountResult.rows[0].count),
          reviewCount: parseInt(reviewCountResult.rows[0].count)
        }
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/church-auth/congregation
// ============================================================
// Returns all users who belong to this church.

router.get('/congregation', authenticateChurch, async (req, res, next) => {
  try {
    const { churchId } = req.church

    const result = await pool.query(
      `SELECT DISTINCT u.id, u.name, u.avatar, u.photo_url, u.role, u.city, u.state
       FROM users u
       WHERE u.id IN (
         SELECT user_id FROM church_favorites WHERE church_id = $1
         UNION
         SELECT user_id FROM church_reviews WHERE church_id = $1
         UNION
         SELECT id FROM users WHERE preferred_church_id = $1
       )
       ORDER BY u.name ASC`,
      [churchId]
    )

    res.json({
      members: result.rows.map(u => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        photoUrl: u.photo_url,
        role: u.role,
        city: u.city,
        state: u.state
      }))
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/church-auth/verify-guide
// ============================================================
// Adds a guide to the church's verified guides list.
// Body: { guideId }

router.post('/verify-guide', authenticateChurch, async (req, res, next) => {
  try {
    const { accountId } = req.church
    const { guideId } = req.body

    if (!guideId) {
      return res.status(400).json({ error: 'Guide ID is required.' })
    }

    // Verify the guide exists and has role='guide'
    const guideCheck = await pool.query(
      "SELECT id, name FROM users WHERE id = $1 AND role = 'guide'",
      [guideId]
    )
    if (guideCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Guide not found or user is not a guide.' })
    }

    // Insert (ON CONFLICT DO NOTHING if already linked)
    await pool.query(
      'INSERT INTO church_account_guides (church_account_id, guide_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [accountId, guideId]
    )

    res.json({ success: true, guide: { id: guideCheck.rows[0].id, name: guideCheck.rows[0].name } })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// DELETE /api/church-auth/verify-guide/:guideId
// ============================================================
// Removes a guide from verified guides (can't remove the last one).

router.delete('/verify-guide/:guideId', authenticateChurch, async (req, res, next) => {
  try {
    const { accountId } = req.church
    const guideId = parseInt(req.params.guideId)

    // Check how many guides are linked
    const countResult = await pool.query(
      'SELECT COUNT(*) AS count FROM church_account_guides WHERE church_account_id = $1',
      [accountId]
    )

    if (parseInt(countResult.rows[0].count) <= 1) {
      return res.status(400).json({ error: 'Cannot remove the last guide. At least one guide must remain.' })
    }

    await pool.query(
      'DELETE FROM church_account_guides WHERE church_account_id = $1 AND guide_id = $2',
      [accountId, guideId]
    )

    res.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/church-auth/search-guides
// ============================================================
// Search guides by name (for adding verified guides).

router.get('/search-guides', authenticateChurch, async (req, res, next) => {
  try {
    const q = req.query.q || ''

    if (!q.trim()) {
      return res.json({ guides: [] })
    }

    const result = await pool.query(
      `SELECT id, name, avatar, photo_url
       FROM users
       WHERE role = 'guide' AND name ILIKE '%' || $1 || '%'
       LIMIT 10`,
      [q.trim()]
    )

    res.json({
      guides: result.rows.map(g => ({
        id: g.id,
        name: g.name,
        avatar: g.avatar,
        photoUrl: g.photo_url
      }))
    })
  } catch (error) {
    next(error)
  }
})

export default router
