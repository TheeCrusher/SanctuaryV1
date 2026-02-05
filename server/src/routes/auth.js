// ============================================================
// Auth Routes - Register & Login
// ============================================================
// POST /api/auth/register - Create a new user account
// POST /api/auth/login    - Log in and get a JWT token
//
// These replace the hardcoded login check in AppContext.jsx:
//   if (email === TEST_EMAIL && password === TEST_PASSWORD)
//
// Now credentials are checked against real database records.
// ============================================================

import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../config/db.js'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()

// Helper function to create a JWT token
function createToken(userId) {
  return jwt.sign(
    { userId },                           // Payload: data stored in the token
    process.env.JWT_SECRET,               // Secret key to sign the token
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }  // Token expires in 7 days
  )
}

// ============================================================
// POST /api/auth/register
// ============================================================
// Creates a new user account.
//
// Request body: { name, email, password, role? }
// Response:     { token, user: { id, name, email, avatar, role } }
//
// What happens:
// 1. Check if email is already taken
// 2. Hash the password (NEVER store plain text passwords!)
// 3. Insert the new user into the database
// 4. Create a JWT token and send it back

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' })
    }

    // Check if email is already in use
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already in use.' })
    }

    // Hash the password with bcrypt (10 "salt rounds" = good security)
    // This turns "Sanctuary123" into something like "$2a$10$X7yz..."
    // Even if someone steals the database, they can't read passwords
    const passwordHash = await bcrypt.hash(password, 10)

    // Insert the new user into the database
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, avatar, photo_url, role, created_at`,
      [name, email, passwordHash, role || 'seeker']
    )

    const user = result.rows[0]

    // Create a JWT token for this new user
    const token = createToken(user.id)

    // Send back the token and user data
    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        photoUrl: user.photo_url,
        role: user.role
      }
    })
  } catch (error) {
    next(error)
  }
})

// ============================================================
// POST /api/auth/login
// ============================================================
// Logs in an existing user.
//
// Request body: { email, password }
// Response:     { token, user: { id, name, email, avatar, photoUrl, role } }
//
// What happens:
// 1. Find the user by email
// 2. Compare the password with the stored hash
// 3. If match, create a JWT token and send it back

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    // Look up the user by email
    const result = await pool.query(
      'SELECT id, name, email, password_hash, avatar, photo_url, role FROM users WHERE email = $1',
      [email]
    )

    if (result.rows.length === 0) {
      // User not found - use a vague message for security
      // (don't reveal whether the email exists or not)
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    const user = result.rows[0]

    // Compare the provided password with the stored hash
    // bcrypt.compare handles the hashing comparison internally
    const passwordMatch = await bcrypt.compare(password, user.password_hash)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' })
    }

    // Create a JWT token
    const token = createToken(user.id)

    // Send back the token and user data (never send password_hash!)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        photoUrl: user.photo_url,
        role: user.role
      }
    })
  } catch (error) {
    next(error)
  }
})

export default router
