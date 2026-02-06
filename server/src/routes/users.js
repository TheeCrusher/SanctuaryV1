// ============================================================
// User Routes
// ============================================================
// GET  /api/users/me        - Get current user's profile
// PUT  /api/users/me        - Update profile (name, avatar, photo)
// GET  /api/users/available - List people available to chat with
//
// All routes are protected (require JWT token).
// Replaces: user state and AVAILABLE_PEOPLE in AppContext.jsx
// ============================================================

import { Router } from 'express'
import pool from '../config/db.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// All user routes require authentication
router.use(authenticate)

// ============================================================
// GET /api/users/me
// ============================================================
// Returns the current logged-in user's profile.
// The user's ID comes from the JWT token (set by auth middleware).
//
// Replaces: user state in AppContext.jsx

router.get('/me', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, avatar, photo_url, role, bio, specialization, location, created_at FROM users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        photoUrl: user.photo_url,
        role: user.role,
        bio: user.bio,
        specialization: user.specialization,
        location: user.location,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// PUT /api/users/me
// ============================================================
// Updates the current user's profile.
// Only updates fields that are provided in the request body.
//
// Request body: { name?, avatar?, photoUrl?, bio?, specialization?, location? } (all optional)
// Replaces: updateUserPhoto() in AppContext.jsx

router.put('/me', async (req, res, next) => {
  try {
    const { name, avatar, photoUrl, bio, specialization, location } = req.body

    // Build the UPDATE query dynamically based on which fields were provided
    const updates = []
    const values = []
    let paramCount = 0

    if (name !== undefined) {
      paramCount++
      updates.push(`name = $${paramCount}`)
      values.push(name)
    }
    if (avatar !== undefined) {
      paramCount++
      updates.push(`avatar = $${paramCount}`)
      values.push(avatar)
    }
    if (photoUrl !== undefined) {
      paramCount++
      updates.push(`photo_url = $${paramCount}`)
      values.push(photoUrl)
    }
    if (bio !== undefined) {
      paramCount++
      updates.push(`bio = $${paramCount}`)
      values.push(bio)
    }
    if (specialization !== undefined) {
      paramCount++
      updates.push(`specialization = $${paramCount}`)
      values.push(specialization)
    }
    if (location !== undefined) {
      paramCount++
      updates.push(`location = $${paramCount}`)
      values.push(location)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' })
    }

    // Always update the updated_at timestamp
    updates.push('updated_at = NOW()')

    // Add the user ID as the last parameter
    paramCount++
    values.push(req.user.id)

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, name, email, avatar, photo_url, role, bio, specialization, location`,
      values
    )

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        photoUrl: user.photo_url,
        role: user.role,
        bio: user.bio,
        specialization: user.specialization,
        location: user.location
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/users/available
// ============================================================
// Returns a list of users available for starting conversations.
// Excludes the current user from the list.
//
// IMPORTANT: This must be defined BEFORE the /:id route,
// otherwise Express would match "available" as an :id parameter.
//
// Replaces: AVAILABLE_PEOPLE constant in AppContext.jsx

router.get('/available', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, avatar, role FROM users WHERE id != $1 ORDER BY name ASC',
      [req.user.id]
    )

    const people = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      role: row.role.charAt(0).toUpperCase() + row.role.slice(1) // "seeker" → "Seeker"
    }))

    res.json({ people })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// GET /api/users/:id
// ============================================================
// Returns another user's public profile.

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id, name, avatar, photo_url, role, bio, specialization, location, created_at FROM users WHERE id = $1',
      [req.params.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }

    const user = result.rows[0]
    res.json({
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        photoUrl: user.photo_url,
        role: user.role,
        bio: user.bio,
        specialization: user.specialization,
        location: user.location,
        createdAt: user.created_at
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
